import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  QueryCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import { supabase } from "../integrations/supabase/client";

// Cache the DynamoDB client instance
let cachedClient: DynamoDBDocumentClient | null = null;
let credentialsExpiry: number | null = null;

const createDynamoDBClient = async () => {
  // Check if we have a valid cached client
  if (cachedClient && credentialsExpiry && Date.now() < credentialsExpiry) {
    return cachedClient;
  }

  // Fetch AWS credentials from Supabase secrets
  const [accessKeyResponse, secretKeyResponse] = await Promise.all([
    supabase.functions.invoke('get-secret', {
      body: { name: 'AWS_ACCESS_KEY_ID' }
    }),
    supabase.functions.invoke('get-secret', {
      body: { name: 'AWS_SECRET_ACCESS_KEY' }
    })
  ]);

  if (accessKeyResponse.error || secretKeyResponse.error) {
    console.error("Error fetching AWS credentials:", accessKeyResponse.error || secretKeyResponse.error);
    throw new Error("Failed to fetch AWS credentials");
  }

  const client = new DynamoDBClient({
    region: "us-east-2",
    credentials: {
      accessKeyId: accessKeyResponse.data.value,
      secretAccessKey: secretKeyResponse.data.value,
    },
  });

  cachedClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  // Cache credentials for 55 minutes (AWS tokens typically expire after 1 hour)
  credentialsExpiry = Date.now() + (55 * 60 * 1000);

  return cachedClient;
};

export const getCameraData = async (camName: string) => {
  const docClient = await createDynamoDBClient();

  try {
    const command = new QueryCommand({
      TableName: "fire-or-no-fire",
      IndexName: "cam_name-timestamp-index",
      KeyConditionExpression: "cam_name = :camName",
      ExpressionAttributeValues: {
        ":camName": camName,
      },
      ScanIndexForward: true,
      // Limit results to last 24 hours to reduce data transfer
      FilterExpression: "#ts >= :dayAgo",
      ExpressionAttributeNames: {
        "#ts": "timestamp"
      },
      ExpressionAttributeValues: {
        ":camName": camName,
        ":dayAgo": Math.floor(Date.now()/1000) - (24 * 60 * 60)
      }
    });

    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error("Error fetching camera data by name:", error);
    throw error;
  }
};