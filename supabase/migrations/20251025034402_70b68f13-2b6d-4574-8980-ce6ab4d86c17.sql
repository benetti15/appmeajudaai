-- Corrigir avisos de segurança das funções de geolocalização

-- Recriar a função calculate_distance com search_path
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  radius_earth NUMERIC := 6371;
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN radius_earth * c;
END;
$$;

-- Recriar find_nearby_professionals com search_path
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
SECURITY DEFINER
SET search_path = public
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