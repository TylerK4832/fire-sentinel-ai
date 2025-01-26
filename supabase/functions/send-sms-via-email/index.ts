import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendSMSBody {
  to: string;
  message: string;
}

// Map of carrier domains for SMS gateways
const carrierGateways: { [key: string]: string } = {
  default: 'vtext.com',     // Verizon
  att: 'txt.att.net',       // AT&T
  tmobile: 'tmomail.net',   // T-Mobile
  sprint: 'messaging.sprintpcs.com', // Sprint
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME')
    const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL')

    // Log configuration (without sensitive data)
    console.log('SMTP Configuration:', {
      hostExists: !!SMTP_HOST,
      portExists: !!SMTP_PORT,
      usernameExists: !!SMTP_USERNAME,
      fromEmailExists: !!FROM_EMAIL
    });

    if (!SMTP_USERNAME || !SMTP_PASSWORD || !FROM_EMAIL) {
      throw new Error('Missing SMTP credentials')
    }

    const { to, message } = await req.json() as SendSMSBody
    
    console.log('Attempting to send SMS via email to:', to);

    // Remove any formatting from the phone number
    const cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length !== 11 && cleanNumber.length !== 10) {
      throw new Error('Invalid phone number format');
    }

    // Remove country code if present
    const phoneNumber = cleanNumber.length === 11 ? cleanNumber.substring(1) : cleanNumber;
    
    // Try sending to multiple carriers (you might want to let users specify their carrier)
    const client = new SmtpClient();
    
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    // Send to default gateway (Verizon)
    const emailTo = `${phoneNumber}@${carrierGateways.default}`;
    await client.send({
      from: FROM_EMAIL,
      to: emailTo,
      subject: "FireWatch Alert",
      content: message,
    });

    await client.close();

    console.log('SMS via email sent successfully to:', emailTo);

    return new Response(JSON.stringify({ 
      success: true,
      to: emailTo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error sending SMS via email:', {
      message: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})