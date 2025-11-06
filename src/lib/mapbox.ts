import { supabase } from "@/integrations/supabase/client";

let mapboxToken: string | null = null;

/**
 * Inicializa o Mapbox e retorna o token público
 * Busca do backend via Edge Function se necessário
 */
export async function initializeMapbox(): Promise<string> {
  // Verifica se já temos token em cache (sessionStorage)
  const cachedToken = sessionStorage.getItem('mapbox_token');
  if (cachedToken) {
    mapboxToken = cachedToken;
    return cachedToken;
  }

  try {
    // Busca token do backend
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) throw error;
    if (!data?.token) throw new Error('Token não retornado');

    mapboxToken = data.token;
    sessionStorage.setItem('mapbox_token', data.token);
    
    return data.token;
  } catch (error) {
    console.error('Erro ao buscar token Mapbox:', error);
    throw new Error('Não foi possível inicializar o mapa');
  }
}

/**
 * Retorna o token em cache (se disponível)
 */
export function getMapboxToken(): string | null {
  return mapboxToken || sessionStorage.getItem('mapbox_token');
}

/**
 * Limpa o token do cache
 */
export function clearMapboxToken(): void {
  mapboxToken = null;
  sessionStorage.removeItem('mapbox_token');
}
