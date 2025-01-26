import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertSubscription {
  id: string;
  user_id: string;
  camera_id: string;
  phone_number: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Process each subscription
    for (const sub of subscriptions || []) {
      try {
        // Query DynamoDB for the latest fire detection for this camera
        const { data: fireData, error: fireError } = await supabase
          .functions.invoke('get-secret', {
            body: { name: 'AWS_ACCESS_KEY_ID' }
          });
        
        const { data: secretKeyData, error: secretKeyError } = await supabase
          .functions.invoke('get-secret', {
            body: { name: 'AWS_SECRET_ACCESS_KEY' }
          });

        if (fireError || secretKeyError) throw fireError || secretKeyError;

        // Create DynamoDB client
        const dynamoDB = new AWS.DynamoDB.DocumentClient({
          region: "us-east-2",
          credentials: {
            accessKeyId: fireData.value,
            secretAccessKey: secretKeyData.value,
          },
        });

        // Query DynamoDB for latest fire detection
        const params = {
          TableName: "fire-or-no-fire",
          IndexName: "cam_name-timestamp-index",
          KeyConditionExpression: "cam_name = :camName",
          ExpressionAttributeValues: {
            ":camName": sub.camera_id,
          },
          Limit: 1,
          ScanIndexForward: false, // Get most recent first
        };

        const result = await dynamoDB.query(params).promise();
        const latestDetection = result.Items?.[0];

        // If there's a fire detection in the last 10 minutes, send notification
        if (latestDetection && 
            latestDetection.label === 'fire' && 
            latestDetection.timestamp > (Date.now()/1000 - 600)) { // 600 seconds = 10 minutes
          
          console.log(`Fire detected for camera ${sub.camera_id}, notifying ${sub.phone_number}`);

          // Send notification via email-to-SMS
          await supabase.functions.invoke('send-sms-via-email', {
            body: {
              to: sub.phone_number,
              message: `🔥 FIRE ALERT: Potential fire detected by camera ${sub.camera_id}. Please check the camera feed immediately.`,
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