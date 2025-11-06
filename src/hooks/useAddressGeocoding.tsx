import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AddressData } from "@/lib/address-utils";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export function useAddressGeocoding() {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Geocodifica um endereço usando a Edge Function
   */
  const geocodeAddress = async (
    query: string
  ): Promise<GeocodeResult[] | null> => {
    setIsGeocoding(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: query }
      });

      if (error) throw error;

      if (!data.features || data.features.length === 0) {
        setError('Nenhum resultado encontrado');
        return null;
      }

      // Mapear resultados do Mapbox para nosso formato
      const results: GeocodeResult[] = data.features.map((feature: any) => {
        const [longitude, latitude] = feature.center;
        const context = feature.context || [];
        
        // Extrair informações do contexto
        const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'))?.text;
        const place = context.find((c: any) => c.id.startsWith('place'))?.text;
        const region = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('BR-', '');
        const postcode = context.find((c: any) => c.id.startsWith('postcode'))?.text;

        // Extrair rua e número do place_name
        const placeName = feature.place_name || '';
        const addressParts = placeName.split(',')[0].trim();
        const numberMatch = addressParts.match(/\d+/);
        const street = addressParts.replace(/\d+/, '').trim();
        const number = numberMatch ? numberMatch[0] : '';

        return {
          latitude,
          longitude,
          formatted_address: feature.place_name,
          street: street || feature.text,
          number,
          neighborhood,
          city: place,
          state: region,
          postal_code: postcode
        };
      });

      return results;
    } catch (err) {
      console.error('Erro ao geocodificar:', err);
      setError('Erro ao buscar endereço');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Geocodifica usando CEP via ViaCEP
   */
  const geocodeByCEP = async (cep: string): Promise<Partial<AddressData> | null> => {
    setIsGeocoding(true);
    setError(null);

    try {
      const cleanCEP = cep.replace(/\D/g, '');
      
      // Buscar dados do CEP via ViaCEP
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const viaCepData = await viaCepResponse.json();

      if (viaCepData.erro) {
        setError('CEP não encontrado');
        return null;
      }

      // Geocodificar o endereço completo via Mapbox
      const fullAddress = `${viaCepData.logradouro}, ${viaCepData.bairro}, ${viaCepData.localidade}, ${viaCepData.uf}`;
      
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: fullAddress }
      });

      if (error) throw error;

      const feature = data.features?.[0];
      if (!feature) {
        setError('Não foi possível geocodificar o CEP');
        return null;
      }

      const [longitude, latitude] = feature.center;

      return {
        street: viaCepData.logradouro,
        neighborhood: viaCepData.bairro,
        city: viaCepData.localidade,
        state: viaCepData.uf,
        postal_code: cep,
        latitude,
        longitude,
        formatted_address: fullAddress
      };
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError('Erro ao buscar CEP');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Reverse geocoding: coordenadas -> endereço
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<Partial<AddressData> | null> => {
    setIsGeocoding(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { latitude, longitude }
      });

      if (error) throw error;

      const feature = data.features?.[0];
      if (!feature) {
        setError('Endereço não encontrado');
        return null;
      }

      const context = feature.context || [];
      const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'))?.text;
      const place = context.find((c: any) => c.id.startsWith('place'))?.text;
      const region = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('BR-', '');
      const postcode = context.find((c: any) => c.id.startsWith('postcode'))?.text;

      const placeName = feature.place_name || '';
      const addressParts = placeName.split(',')[0].trim();
      const numberMatch = addressParts.match(/\d+/);
      const street = addressParts.replace(/\d+/, '').trim();
      const number = numberMatch ? numberMatch[0] : '';

      return {
        street: street || feature.text,
        number,
        neighborhood,
        city: place,
        state: region,
        postal_code: postcode,
        latitude,
        longitude,
        formatted_address: feature.place_name
      };
    } catch (err) {
      console.error('Erro ao fazer reverse geocoding:', err);
      setError('Erro ao buscar endereço');
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  return {
    geocodeAddress,
    geocodeByCEP,
    reverseGeocode,
    isGeocoding,
    error
  };
}
