-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS
-- ============================================

-- 1. Criar tabela de histórico de status para rastrear estados intermediários
CREATE TABLE IF NOT EXISTS public.service_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_service_status_history_request ON public.service_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_service_status_history_created ON public.service_status_history(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.service_status_history ENABLE ROW LEVEL SECURITY;

-- Policies para service_status_history
CREATE POLICY "Users can view status history of their requests"
ON public.service_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_requests
    WHERE service_requests.id = service_status_history.request_id
    AND service_requests.client_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM service_requests sr
    INNER JOIN quotes q ON q.request_id = sr.id
    WHERE sr.id = service_status_history.request_id
    AND q.professional_id = auth.uid()
    AND q.is_accepted = true
  )
);

CREATE POLICY "Authenticated users can insert status history"
ON public.service_status_history
FOR INSERT
WITH CHECK (auth.uid() = changed_by);

-- 2. Adicionar campos para reviews avançadas (se não existirem)
DO $$ 
BEGIN
  -- Adicionar campos de avaliação detalhada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'service_quality') THEN
    ALTER TABLE public.reviews ADD COLUMN service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'punctuality') THEN
    ALTER TABLE public.reviews ADD COLUMN punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'communication') THEN
    ALTER TABLE public.reviews ADD COLUMN communication INTEGER CHECK (communication >= 1 AND communication <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'price_value') THEN
    ALTER TABLE public.reviews ADD COLUMN price_value INTEGER CHECK (price_value >= 1 AND price_value <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'would_recommend') THEN
    ALTER TABLE public.reviews ADD COLUMN would_recommend BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 3. Melhorar sistema de notificações
-- Adicionar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 4. Função para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só registra se o status realmente mudou
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.service_status_history (request_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para registrar mudanças de status
DROP TRIGGER IF EXISTS trigger_log_status_change ON public.service_requests;
CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();

-- 5. Adicionar coluna para armazenar status estendido no service_requests
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'extended_status') THEN
    ALTER TABLE public.service_requests ADD COLUMN extended_status TEXT;
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE public.service_status_history IS 'Histórico completo de mudanças de status dos serviços, incluindo estados intermediários';
COMMENT ON COLUMN public.service_requests.extended_status IS 'Status estendido para UI (on_way, arrived, awaiting_client_confirmation, payment_confirmed)';
COMMENT ON COLUMN public.reviews.service_quality IS 'Avaliação da qualidade do serviço (1-5)';
COMMENT ON COLUMN public.reviews.would_recommend IS 'Se o cliente recomendaria o profissional';