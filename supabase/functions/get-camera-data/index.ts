import { serve } from "https://deno.fresh.run/std@0.168.0/http/server.ts";
import { DynamoDBClient } from "npm:@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "npm:@aws-sdk/lib-dynamodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cameraId } = await req.json();

    if (!cameraId) {
      return new Response(
        JSON.stringify({ error: 'Camera ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = new DynamoDBClient({
      region: "us-west-1",
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    const docClient = DynamoDBDocumentClient.from(client);

    const params = {
      TableName: "camera_data",
      KeyConditionExpression: "cam_name = :camName",
      ExpressionAttributeValues: {
        ":camName": cameraId,
      },
      ScanIndexForward: false,
      Limit: 100,
    };

    const command = new QueryCommand(params);
    const response = await docClient.send(command);

    return new Response(
      JSON.stringify(response.Items || []),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch camera data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});