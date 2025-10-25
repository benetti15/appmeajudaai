-- Recriar a view sem SECURITY DEFINER (padrão é SECURITY INVOKER)
DROP VIEW IF EXISTS public.professionals_with_location;

CREATE VIEW public.professionals_with_location 
WITH (security_invoker = true)
AS
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