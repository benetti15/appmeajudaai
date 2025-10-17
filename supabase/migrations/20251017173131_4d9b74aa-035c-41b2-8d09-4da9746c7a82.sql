-- FASE 1: Corrigir RLS de notificações
-- Permitir que usuários autenticados criem notificações para outros usuários
CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Adicionar campo is_active às categorias de serviço (para poder desabilitar categorias)
ALTER TABLE public.service_categories 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_category_id ON public.service_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON public.quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_quotes_professional_id ON public.quotes(professional_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_request_id ON public.chat_messages(request_id);

-- Habilitar Realtime para todas as tabelas necessárias
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;
ALTER TABLE public.quotes REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;