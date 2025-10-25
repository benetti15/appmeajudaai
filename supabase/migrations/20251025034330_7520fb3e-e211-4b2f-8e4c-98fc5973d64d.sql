-- ============================================
-- FASE 2: SISTEMA DE GEOLOCALIZAÇÃO
-- ============================================

-- 1. Adicionar coordenadas geográficas nas tabelas
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 10;

-- 2. Criar índices para melhorar performance de buscas geográficas
CREATE INDEX IF NOT EXISTS idx_service_requests_location ON public.service_requests(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude);

-- 3. Função para calcular distância entre dois pontos (fórmula Haversine)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  radius_earth NUMERIC := 6371; -- Raio da Terra em km
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Converter graus para radianos
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Fórmula de Haversine
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN radius_earth * c;
END;
$$;

-- 4. View para profissionais com suas localizações
CREATE OR REPLACE VIEW public.professionals_with_location AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.city,
  p.state,
  p.latitude,
  p.longitude,
  p.service_radius_km,
  COALESCE(
    (SELECT AVG(rating) FROM reviews WHERE professional_id = p.id),
    0
  ) as average_rating,
  COALESCE(
    (SELECT COUNT(*) FROM reviews WHERE professional_id = p.id),
    0
  ) as total_reviews
FROM profiles p
WHERE p.user_type = 'professional'
AND p.latitude IS NOT NULL
AND p.longitude IS NOT NULL;

-- 5. Função para buscar profissionais próximos
CREATE OR REPLACE FUNCTION public.find_nearby_professionals(
  user_lat NUMERIC,
  user_lon NUMERIC,
  max_distance_km INTEGER DEFAULT 50,
  category_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  distance_km NUMERIC,
  average_rating NUMERIC,
  total_reviews BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.city,
    p.state,
    p.latitude,
    p.longitude,
    calculate_distance(user_lat, user_lon, p.latitude, p.longitude) as distance_km,
    p.average_rating,
    p.total_reviews
  FROM professionals_with_location p
  WHERE calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= COALESCE(p.service_radius_km, max_distance_km)
  AND (category_filter IS NULL OR EXISTS (
    SELECT 1 FROM professional_specialties ps 
    WHERE ps.professional_id = p.id 
    AND ps.category_id = category_filter
  ))
  ORDER BY distance_km ASC;
END;
$$;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.latitude IS 'Latitude da localização do usuário (para profissionais, centro da área de atendimento)';
COMMENT ON COLUMN public.profiles.longitude IS 'Longitude da localização do usuário';
COMMENT ON COLUMN public.profiles.service_radius_km IS 'Raio de atendimento do profissional em quilômetros';
COMMENT ON FUNCTION public.calculate_distance IS 'Calcula distância entre dois pontos geográficos usando fórmula de Haversine';
COMMENT ON FUNCTION public.find_nearby_professionals IS 'Busca profissionais próximos a uma localização dentro de um raio específico';