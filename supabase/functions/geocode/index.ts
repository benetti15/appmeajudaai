import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, longitude, latitude } = await req.json()
    
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!MAPBOX_TOKEN) {
      throw new Error('Mapbox token not configured')
    }

    let url: string
    
    // Forward geocoding (address -> coordinates)
    if (query) {
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=BR&` +
        `language=pt&` +
        `limit=5&` +
        `types=address,place`
    } 
    // Reverse geocoding (coordinates -> address)
    else if (longitude !== undefined && latitude !== undefined) {
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
        `access_token=${MAPBOX_TOKEN}&language=pt`
    } else {
      throw new Error('Either query or coordinates must be provided')
    }

    const response = await fetch(url)
    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Geocoding error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
