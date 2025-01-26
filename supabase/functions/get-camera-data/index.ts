import { serve } from "https://deno.fresh.run/std@0.168.0/http/server.ts";
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
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { cameraId } = await req.json();
    console.log('Received request for camera:', cameraId);

    if (!cameraId) {
      return new Response(
        JSON.stringify({ error: 'Camera ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get AWS credentials from environment
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not found');
      return new Response(
        JSON.stringify({ error: 'AWS credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-camera-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch camera data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});