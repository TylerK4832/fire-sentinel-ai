import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

let dynamoClient: DynamoDBDocumentClient | null = null;

const getDynamoClient = () => {
  if (!dynamoClient) {
    // Get credentials from environment variables
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

    console.log('AWS Access Key ID available:', !!accessKeyId);
    console.log('AWS Secret Access Key available:', !!secretAccessKey);

    // Validate credentials before creating client
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not found in environment variables');
    }

    const client = new DynamoDBClient({
      region: "us-west-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    dynamoClient = DynamoDBDocumentClient.from(client);
  }
  return dynamoClient;
};

export const getCameraData = async (cameraId: string) => {
  console.log('Fetching data for camera:', cameraId);
  const client = getDynamoClient();
  
  try {
    const params: QueryCommandInput = {
      TableName: "camera_data",
      KeyConditionExpression: "cam_name = :camName",
      ExpressionAttributeValues: {
        ":camName": cameraId,
      },
      ScanIndexForward: false, // Get most recent first
      Limit: 100, // Limit to last 100 readings
    };

    console.log('DynamoDB query params:', params);
    const command = new QueryCommand(params);
    const response = await client.send(command);
    console.log('DynamoDB response:', response);
    
    return response.Items || [];
  } catch (error) {
    console.error("Error fetching camera data:", error);
    throw error;
  }
};