import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

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

export const getCameraData = async (cameraId: string) => {
  const docClient = createDynamoDBClient();
  
  try {
    const command = new GetCommand({
      TableName: "cameras",
      Key: {
        id: cameraId,
      },
    });

    const response = await docClient.send(command);
    return response.Item;
  } catch (error) {
    console.error("Error fetching camera data:", error);
    throw error;
  } finally {
    // Ensure we clean up the client
    if (docClient) {
      // @ts-ignore - TypeScript doesn't know about the destroy method
      docClient.destroy?.();
    }
  }
};