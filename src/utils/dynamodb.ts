import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  QueryCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import { supabase } from "../integrations/supabase/client";

const createDynamoDBClient = async () => {
  // Fetch AWS credentials from Supabase secrets
  const { data: secretData, error: accessKeyError } = await supabase.functions.invoke('get-secret', {
    body: { name: 'AWS_ACCESS_KEY_ID' }
  });
  
  const { data: secretKeyData, error: secretKeyError } = await supabase.functions.invoke('get-secret', {
    body: { name: 'AWS_SECRET_ACCESS_KEY' }
  });

  if (accessKeyError || secretKeyError) {
    console.error("Error fetching AWS credentials:", accessKeyError || secretKeyError);
    throw new Error("Failed to fetch AWS credentials");
  }

  const client = new DynamoDBClient({
    region: "us-east-2",
    credentials: {
      accessKeyId: secretData.value,
      secretAccessKey: secretKeyData.value,
    },
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

export const getCameraData = async (camName: string) => {
  const docClient = await createDynamoDBClient();

  try {
    const command = new QueryCommand({
      TableName: "fire-or-no-fire", // Your table name
      IndexName: "cam_name-index", // Your GSI name
      KeyConditionExpression: "cam_name = :camName", // Query based on cam_name
      ExpressionAttributeValues: {
        ":camName": camName,
      },
    });

    const response = await docClient.send(command);
    return response.Items || []; // Return all matching items
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