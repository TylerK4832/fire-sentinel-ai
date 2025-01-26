import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cameraId, probability } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all subscriptions for this camera
    const { data: subscriptions, error: subscriptionError } = await supabaseClient
      .from('alert_subscriptions')
      .select('*')
      .eq('camera_id', cameraId)

    if (subscriptionError) throw subscriptionError

    // If no subscriptions, return early
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get camera details
    const { data: cameras } = await supabaseClient
      .from('cameras')
      .select('name')
      .eq('id', cameraId)
      .single()

    const cameraName = cameras?.name || 'Unknown Camera'

    // Initialize Twilio client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    const client = twilio(accountSid, authToken)

    // Send SMS to all subscribers
    const messagePromises = subscriptions.map(subscription =>
      client.messages.create({
        body: `🚨 Fire Alert: ${cameraName} has detected a potential fire with ${probability}% probability.`,
        from: twilioNumber,
        to: subscription.phone_number
      })
    )

    await Promise.all(messagePromises)

    return new Response(
      JSON.stringify({ message: 'Alerts sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})