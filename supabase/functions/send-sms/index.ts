import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from 'npm:twilio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendSMSBody {
  to: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

    // Log configuration (without sensitive data)
    console.log('Twilio Configuration:', {
      accountSidExists: !!TWILIO_ACCOUNT_SID,
      authTokenExists: !!TWILIO_AUTH_TOKEN,
      fromNumber: TWILIO_PHONE_NUMBER
    });

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Missing Twilio credentials')
    }

    const { to, message } = await req.json() as SendSMSBody
    
    console.log('Attempting to send SMS to:', to);

    // Initialize Twilio client
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    // Send message using Twilio client
    const result = await client.messages.create({
      body: message,
      to: to,
      from: TWILIO_PHONE_NUMBER,
    })

    console.log('SMS sent successfully:', {
      sid: result.sid,
      status: result.status,
      to: result.to,
      from: result.from
    });

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.sid,
      status: result.status 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error sending SMS:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
      status: error.status
    });

    return new Response(JSON.stringify({ 
      error: error.message,
      code: error.code,
      status: error.status 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})