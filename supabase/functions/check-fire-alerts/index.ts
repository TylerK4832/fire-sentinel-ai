import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { DynamoDBClient } from "npm:@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "npm:@aws-sdk/lib-dynamodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting fire alert check...');

    // Get all alert subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('alert_subscriptions')
      .select('*');

    if (subError) throw subError;

    console.log(`Found ${subscriptions?.length || 0} subscriptions to process`);

    // Initialize DynamoDB client
    const dynamoClient = new DynamoDBClient({
      region: "us-east-2",
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    const docClient = DynamoDBDocumentClient.from(dynamoClient);

    // Process each subscription
    for (const sub of subscriptions || []) {
      try {
        // Query DynamoDB for latest fire detection
        const command = new QueryCommand({
          TableName: "fire-or-no-fire",
          IndexName: "cam_name-timestamp-index",
          KeyConditionExpression: "cam_name = :camName",
          ExpressionAttributeValues: {
            ":camName": sub.camera_id,
          },
          Limit: 1,
          ScanIndexForward: false, // Get most recent first
        });

        const result = await docClient.send(command);
        const latestDetection = result.Items?.[0];

        // Check if there's a fire detection in the last 10 minutes
        if (latestDetection && 
            latestDetection.label === 'fire' && 
            latestDetection.timestamp > (Date.now()/1000 - 600)) { // 600 seconds = 10 minutes
          
          console.log(`Fire detected for camera ${sub.camera_id}, notifying ${sub.phone_number}`);

          // Send notification via email-to-SMS
          await supabase.functions.invoke('send-sms-via-email', {
            body: {
              to: sub.phone_number,
              message: `🔥 FIRE ALERT: Potential fire detected by camera ${sub.camera_id} with ${(latestDetection.fire_score * 100).toFixed(1)}% confidence. Please check immediately.`,
            },
          });
        }
      } catch (subError) {
        console.error(`Error processing subscription ${sub.id}:`, subError);
        // Continue with next subscription even if one fails
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Fire alert check completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})