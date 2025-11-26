-- Fase 1.1: Proteger dados sensíveis dos perfis
-- Criar view pública que expõe apenas campos seguros

-- 1. Criar view pública segura para profissionais
CREATE OR REPLACE VIEW public.professional_public_view AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.city,
  p.state,
  p.service_radius_km,
  p.created_at,
  -- Calcular rating e reviews da view existente
  pwl.average_rating,
  pwl.total_reviews
FROM profiles p
LEFT JOIN professionals_with_location pwl ON pwl.id = p.id
WHERE p.user_type = 'professional';

-- 2. Remover política antiga que expõe todos os campos
DROP POLICY IF EXISTS "Clients can view professional profiles" ON profiles;

-- 3. Criar nova política restritiva
-- Clientes podem ver apenas seus próprios dados completos OU dados públicos de profissionais (via código)
CREATE POLICY "Users can view public professional data"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id  -- Pode ver seus próprios dados completos
  OR (
    user_type = 'professional' 
    AND auth.uid() IS NOT NULL  -- Apenas usuários autenticados
  )
);

-- Nota: A política ainda permite acesso aos campos, mas vamos filtrar no código da aplicação
-- para retornar apenas os campos seguros quando buscar profissionais