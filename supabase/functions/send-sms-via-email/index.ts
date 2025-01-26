import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    console.log('Starting SMS via email process...');

    if (!SMTP_USERNAME || !SMTP_PASSWORD || !FROM_EMAIL) {
      throw new Error('Missing SMTP credentials')
    }

    const { to, message } = await req.json() as SendSMSBody
    
    console.log('Processing request for phone number:', to);

    // Remove any formatting from the phone number
    const cleanNumber = to.replace(/\D/g, '');
    if (cleanNumber.length !== 11 && cleanNumber.length !== 10) {
      throw new Error('Invalid phone number format');
    }

    // Remove country code if present
    const phoneNumber = cleanNumber.length === 11 ? cleanNumber.substring(1) : cleanNumber;
    
    const emailTo = `${phoneNumber}@${carrierGateways.default}`;
    console.log('Target email address:', emailTo);

    try {
      console.log('Preparing email data...');

      const encoder = new TextEncoder();
      const emailContent = `From: ${FROM_EMAIL}\r\nTo: ${emailTo}\r\nSubject: \r\n\r\n${message}`;
      
      const conn = await Deno.connect({ hostname: "smtp.gmail.com", port: 465 });
      const tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });
      
      // SMTP handshake
      await readResponse(tlsConn); // Read greeting
      await writeCommand(tlsConn, `EHLO localhost\r\n`);
      await readResponse(tlsConn);
      
      // Authentication
      await writeCommand(tlsConn, "AUTH LOGIN\r\n");
      await readResponse(tlsConn);
      await writeCommand(tlsConn, `${btoa(SMTP_USERNAME)}\r\n`);
      await readResponse(tlsConn);
      await writeCommand(tlsConn, `${btoa(SMTP_PASSWORD)}\r\n`);
      await readResponse(tlsConn);
      
      // Send email
      await writeCommand(tlsConn, `MAIL FROM:<${FROM_EMAIL}>\r\n`);
      await readResponse(tlsConn);
      await writeCommand(tlsConn, `RCPT TO:<${emailTo}>\r\n`);
      await readResponse(tlsConn);
      await writeCommand(tlsConn, "DATA\r\n");
      await readResponse(tlsConn);
      await writeCommand(tlsConn, emailContent + "\r\n.\r\n");
      await readResponse(tlsConn);
      await writeCommand(tlsConn, "QUIT\r\n");
      
      tlsConn.close();
      console.log('Email sent successfully');

      return new Response(JSON.stringify({ 
        success: true,
        to: emailTo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (smtpError) {
      console.error('SMTP Error:', smtpError);
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

// Helper functions for SMTP communication
async function readResponse(conn: Deno.TlsConn): Promise<string> {
  const buffer = new Uint8Array(1024);
  const n = await conn.read(buffer);
  if (n === null) throw new Error("Connection closed");
  return new TextDecoder().decode(buffer.subarray(0, n));
}

async function writeCommand(conn: Deno.TlsConn, command: string): Promise<void> {
  const encoder = new TextEncoder();
  await conn.write(encoder.encode(command));
}