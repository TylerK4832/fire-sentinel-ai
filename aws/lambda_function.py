import boto3
import requests
import json
import time
import os
from decimal import Decimal

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sagemaker_runtime = boto3.client('runtime.sagemaker', region_name='us-east-2')
endpoint_name = 'huggingface-pytorch-inference-2025-01-25-23-07-41-296'

# Configuration
BUCKET_NAME = 'filtered-cams-new'
BUCKET_NAME_TO_PUT = 'fire-current-images-new'
FILE_KEY = 'filtered_cameras_100_with_demo.json'
DDB_TABLE_NAME = 'fire-or-no-fire'

def store_metadata_in_dynamodb(camera_id, label, fire_score, no_fire_score):
    """Store detection results in DynamoDB."""
    # Convert all float values in the confidences to Decimal
    table = dynamodb.Table(DDB_TABLE_NAME)
    table.put_item(
        Item={
            'id': camera_id+"-"+str(time.time()),
            "cam_name": camera_id,
            'label': label,
            'fire_score': Decimal(fire_score),
            'no_fire_score': Decimal(no_fire_score),
            'timestamp': int(time.time())
        }
    )
    print(f"Metadata stored in DynamoDB for camera ID: {camera_id}")

def upload_image_to_s3(image_bytes, camera_id):
    """Upload image bytes to the S3 bucket."""
    # Use a consistent object key for each camera to overwrite the file
    timestamp = int(time.time())
    object_key = f"camera_images/{camera_id}_{timestamp}.jpg"
    
    # Upload the image to S3
    s3.put_object(Bucket=BUCKET_NAME_TO_PUT, Key=object_key, Body=image_bytes, ContentType='image/jpeg')
    print(f"Image uploaded to S3: {object_key}")
    
    return object_key

def detect_fire_sagemaker(camera_link):
    try:
        # Prepare the payload for SageMaker
        payload = {"inputs": camera_link}

        # Invoke the SageMaker endpoint
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=endpoint_name,
            ContentType='application/json',
            Body=json.dumps(payload)
        )

        # Process the response
        response_body = json.loads(response['Body'].read().decode())
        print(f"SageMaker Response for {camera_link}: {response_body}")
        return response_body  # Expected format: [{'label': 'nofire', 'score': 0.8}, {'label': 'fire', 'score': 0.2}]
    
    except Exception as e:
        print(f"Error invoking SageMaker endpoint: {e}")
        raise e


def lambda_handler(event, context):
    try:
        # Fetch the JSON file from S3
        response = s3.get_object(Bucket=BUCKET_NAME, Key=FILE_KEY)
        file_content = response['Body'].read().decode('utf-8')
        json_data = json.loads(file_content)
        
        # Process each camera
        for camera in json_data:
            try:
                camera_id = camera.get('id')
                camera_link = camera.get('link')
                if not camera_id or not camera_link:
                    print(f"Skipping camera due to missing id or link: {camera}")
                    continue
                
                # Fetch the image from the camera link
                image_response = requests.get(camera_link, timeout=10)
                if image_response.status_code == 200:
                    # Read image bytes
                    image_bytes = image_response.content
                    
                    # Validate the image bytes (check JPEG magic number)
                    if image_bytes[:2] == b'\xff\xd8' and image_bytes[-2:] == b'\xff\xd9':
                        # Detect fire using SageMaker
                        detection_result = detect_fire_sagemaker(camera_link)
                        
                        # Parse SageMaker response
                        fire_score = 0
                        no_fire_score = 0
                        for entry in detection_result:
                            if entry['label'] == 'fire':
                                fire_score = entry['score']
                            elif entry['label'] == 'nofire':
                                no_fire_score = entry['score']
                        
                        if fire_score > no_fire_score:
                            # Fire detected: upload the image to S3
                            upload_image_to_s3(image_bytes, camera_id)
                            store_metadata_in_dynamodb(camera_id, 'fire', fire_score, no_fire_score)
                        else:
                            # No fire: store detection result in DynamoDB
                            store_metadata_in_dynamodb(camera_id, 'nofire', fire_score, no_fire_score)
                    else:
                        print(f"Invalid image format for camera ID {camera_id}")
                else:
                    print(f"Failed to fetch image from {camera_link}: HTTP {image_response.status_code}")
            except Exception as e:
                print(f"Error processing camera ID {camera.get('id')}: {e}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processing completed'})
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
