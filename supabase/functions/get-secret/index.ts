import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { name } = await req.json()
    
    if (!name) {
      throw new Error('Secret name is required')
    }

    // Get the secret value from Deno.env
    const value = Deno.env.get(name)
    
    if (!value) {
      console.error(`Secret ${name} not found`)
      return new Response(
        JSON.stringify({ 
          error: `Secret ${name} not found`,
          status: 404 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Add detailed logging
    console.log(`Successfully retrieved secret: ${name}`)
    
    return new Response(
      JSON.stringify({ value }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in get-secret function:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        status: error.message === 'Method not allowed' ? 405 : 500
      }),
      { 
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})