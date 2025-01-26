import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DynamoDBClient } from "npm:@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "npm:@aws-sdk/lib-dynamodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    const { cameraId } = await req.json();
    console.log('Received request for camera:', cameraId);

    if (!cameraId) {
      throw new Error('Camera ID is required');
    }

    // Get AWS credentials from environment
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not found');
      throw new Error('AWS credentials not configured');
    }

    // Initialize DynamoDB client
    const client = new DynamoDBClient({
      region: "us-west-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const docClient = DynamoDBDocumentClient.from(client);

    // Query parameters
    const params = {
      TableName: "camera_data",
      KeyConditionExpression: "cam_name = :camName",
      ExpressionAttributeValues: {
        ":camName": cameraId,
      },
      ScanIndexForward: false,
      Limit: 100,
    };

    console.log('Querying DynamoDB with params:', JSON.stringify(params, null, 2));

    const command = new QueryCommand(params);
    const response = await docClient.send(command);

    console.log('DynamoDB response received:', response.Items?.length || 0, 'items');

    return new Response(
      JSON.stringify(response.Items || []),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in get-camera-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch camera data',
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});