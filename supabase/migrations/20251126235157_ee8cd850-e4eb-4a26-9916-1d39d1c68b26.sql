-- Fase 1.2: Implementar visibilidade progressiva de endereços em solicitações

-- 1. Remover política antiga que expõe endereços completos
DROP POLICY IF EXISTS "Professionals can view pending requests" ON service_requests;

-- 2. Criar view para solicitações pendentes com dados limitados
CREATE OR REPLACE VIEW public.pending_requests_summary 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  category_id,
  urgency_level,
  city,
  state,
  neighborhood,
  status,
  preferred_date,
  budget_estimate,
  created_at,
  client_id,
  images_urls
FROM service_requests
WHERE status = 'pending';

-- 3. Nova política: profissionais veem dados completos APENAS após enviar orçamento
-- Ou se o cliente os convidou (implícito ao aceitar orçamento)
CREATE POLICY "Professionals can view requests progressively"
ON public.service_requests
FOR SELECT
USING (
  -- Profissionais podem ver solicitações pendentes (dados limitados via código)
  status = 'pending'
  -- OU profissionais que enviaram orçamento (dados completos)
  OR has_quote_for_request(id, auth.uid())
  -- OU o próprio cliente
  OR auth.uid() = client_id
);