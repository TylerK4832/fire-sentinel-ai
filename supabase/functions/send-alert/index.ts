import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { Twilio } from 'npm:twilio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cameraId, probability, phoneNumber, isWelcomeMessage, cameraName } = await req.json()

    // Initialize Twilio client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioNumber = "(866) 885-9350"

    const client = new Twilio(accountSid, authToken)

    let messageBody

    if (isWelcomeMessage) {
      messageBody = `👋 Welcome! You've successfully subscribed to fire alerts for ${cameraName}. You'll receive SMS notifications when potential fires are detected. Reply STOP to unsubscribe.`
    } else {
      messageBody = `🚨 Fire Alert: ${cameraName} has detected a potential fire with ${probability}% probability.`
    }

    // Send SMS
    await client.messages.create({
      body: messageBody,
      from: twilioNumber,
      to: phoneNumber
    })

    return new Response(
      JSON.stringify({ message: 'Message sent successfully' }),
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