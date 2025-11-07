import { supabase } from "@/integrations/supabase/client";

let mapboxToken: string | null = null;

/**
 * Inicializa o Mapbox e retorna o token público
 * Busca do backend via Edge Function se necessário
 */
export async function initializeMapbox(): Promise<string> {
  console.log('🗺️ [Mapbox] Iniciando inicialização do Mapbox...');
  
  // Verifica se já temos token em cache (sessionStorage)
  const cachedToken = sessionStorage.getItem('mapbox_token');
  if (cachedToken) {
    console.log('✅ [Mapbox] Token encontrado no cache');
    mapboxToken = cachedToken;
    return cachedToken;
  }

  console.log('📡 [Mapbox] Buscando token do backend...');
  
  try {
    // Busca token do backend
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.error('❌ [Mapbox] Erro ao invocar edge function:', error);
      throw error;
    }
    
    if (!data?.token) {
      console.error('❌ [Mapbox] Token não retornado pela edge function');
      throw new Error('Token não retornado');
    }

    console.log('✅ [Mapbox] Token obtido com sucesso');
    mapboxToken = data.token;
    sessionStorage.setItem('mapbox_token', data.token);
    
    return data.token;
  } catch (error) {
    console.error('❌ [Mapbox] Erro ao buscar token Mapbox:', error);
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
