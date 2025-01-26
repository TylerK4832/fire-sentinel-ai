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
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL')

    console.log('Checking SMTP credentials...');

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
    
    const client = new SmtpClient();
    
    console.log('Initializing SMTP client...');

    const emailTo = `${phoneNumber}@${carrierGateways.default}`;
    console.log('Target email address:', emailTo);
    
    try {
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 587,
        username: SMTP_USERNAME,
        password: SMTP_PASSWORD,
      });

      console.log('SMTP connection established');

      await client.send({
        from: FROM_EMAIL,
        to: emailTo,
        subject: "",
        content: message,
      });

      console.log('Message sent successfully');
      
      await client.close();
      console.log('SMTP connection closed');

      return new Response(JSON.stringify({ 
        success: true,
        to: emailTo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (smtpError) {
      console.error('SMTP Error:', smtpError);
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing SMTP connection:', closeError);
      }
      throw smtpError;
    }
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})