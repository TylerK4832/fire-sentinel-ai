import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1", // Update this to your region
  credentials: {
    accessKeyId: localStorage.getItem("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: localStorage.getItem("AWS_SECRET_ACCESS_KEY") || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export const getCameraData = async (cameraId: string) => {
  const command = new GetCommand({
    TableName: "cameras", // Update this to your table name
    Key: {
      id: cameraId,
    },
  });

  try {
    const response = await docClient.send(command);
    return response.Item;
  } catch (error) {
    console.error("Error fetching camera data:", error);
    throw error;
  }
};