-- Corrigir view para usar SECURITY INVOKER
DROP VIEW IF EXISTS public.professional_public_view;

CREATE VIEW public.professional_public_view 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.city,
  p.state,
  p.service_radius_km,
  p.created_at,
  pwl.average_rating,
  pwl.total_reviews
FROM profiles p
LEFT JOIN professionals_with_location pwl ON pwl.id = p.id
WHERE p.user_type = 'professional';