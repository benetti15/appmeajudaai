import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

interface GeocodeRequest {
  address?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { address, cep, latitude, longitude } = await req.json() as GeocodeRequest
    
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN')
    
    if (!MAPBOX_TOKEN) {
      throw new Error('Mapbox token não configurado')
    }

    let url: string
    
    // Reverse geocoding (coordenadas -> endereço)
    if (latitude !== undefined && longitude !== undefined) {
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `language=pt&` +
        `country=BR`
    } 
    // Forward geocoding (endereço ou CEP -> coordenadas)
    else if (address || cep) {
      const query = cep ? `${cep}, Brasil` : `${address}, Brasil`
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=BR&` +
        `language=pt&` +
        `limit=5&` +
        `types=address,place,postcode`
    } else {
      throw new Error('Endereço, CEP ou coordenadas devem ser fornecidos')
    }

    console.log('🔍 Geocoding:', { address, cep, latitude, longitude })

    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Mapbox API error:', response.status, errorText)
      throw new Error(`Mapbox API error: ${response.status}`)
    }
    
    const data = await response.json()

    console.log('✅ Geocoding success:', data.features?.length, 'resultados')

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro de geocodificação:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
