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
    const SMTP_HOST = 'smtp.gmail.com'
    const SMTP_PORT = 587
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL')

    // Log configuration (without sensitive data)
    console.log('SMTP Configuration:', {
      host: SMTP_HOST,
      port: SMTP_PORT,
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
    
    const client = new SmtpClient();
    
    console.log('Connecting to SMTP server...');
    
    try {
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USERNAME,
        password: SMTP_PASSWORD,
      });

      console.log('Connected to SMTP server successfully');

      // Send to default gateway (Verizon)
      const emailTo = `${phoneNumber}@${carrierGateways.default}`;
      console.log('Sending email to:', emailTo);

      await client.send({
        from: FROM_EMAIL,
        to: emailTo,
        subject: "",  // Empty subject for SMS
        content: message,
      });

      console.log('Email sent successfully');
      await client.close();

      return new Response(JSON.stringify({ 
        success: true,
        to: emailTo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (smtpError) {
      console.error('SMTP Error:', smtpError);
      await client.close().catch(console.error);
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