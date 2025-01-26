import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

let dynamoClient: DynamoDBDocumentClient | null = null;

const getDynamoClient = () => {
  if (!dynamoClient) {
    const client = new DynamoDBClient({
      region: "us-west-1",
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
      },
    });
    dynamoClient = DynamoDBDocumentClient.from(client);
  }
  return dynamoClient;
};

export const getCameraData = async (cameraId: string) => {
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

    const command = new QueryCommand(params);
    const response = await client.send(command);
    
    return response.Items || [];
  } catch (error) {
    console.error("Error fetching camera data by name:", error);
    throw error;
  }
};