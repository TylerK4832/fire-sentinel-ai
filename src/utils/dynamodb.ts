import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  QueryCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";

const createDynamoDBClient = () => {
  const client = new DynamoDBClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: localStorage.getItem("AWS_ACCESS_KEY_ID") || "",
      secretAccessKey: localStorage.getItem("AWS_SECRET_ACCESS_KEY") || "",
    },
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

export const getCameraData = async (id: string) => {
  const docClient = createDynamoDBClient();

  try {
    const command = new QueryCommand({
      TableName: "fire-or-no-fire",
      KeyConditionExpression: "cam_id = :camId",
      ExpressionAttributeValues: {
        ":camId": id,
      },
      Limit: 1, // Get most recent record
      ScanIndexForward: false, // Sort in descending order (newest first)
    });

    const response = await docClient.send(command);
    return response.Items?.[0] || null;
  } catch (error) {
    console.error("Error fetching camera data:", error);
    throw error;
  } finally {
    if (docClient) {
      // @ts-ignore - TypeScript doesn't know about the destroy method
      docClient.destroy?.();
    }
  }
};

export const getCameraDataByName = async (camName: string) => {
  const docClient = createDynamoDBClient();

  try {
    const command = new QueryCommand({
      TableName: "fire-or-no-fire",
      IndexName: "cam_name-index",
      KeyConditionExpression: "cam_name = :camName",
      ExpressionAttributeValues: {
        ":camName": camName,
      },
    });

    const response = await docClient.send(command);
    return response.Items; 
  } catch (error) {
    console.error("Error fetching camera data by name:", error);
    throw error;
  } finally {
    if (docClient) {
      // @ts-ignore - TypeScript doesn't know about the destroy method
      docClient.destroy?.();
    }
  }
};