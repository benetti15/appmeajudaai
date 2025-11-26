-- Fase 2.2: Tornar buckets sensíveis privados

-- 1. Tornar buckets privados
UPDATE storage.buckets SET public = false WHERE name = 'chat-attachments';
UPDATE storage.buckets SET public = false WHERE name = 'request-images';

-- 2. Criar políticas de acesso para chat-attachments
-- Usuários podem fazer upload de seus próprios anexos
CREATE POLICY "Users can upload own chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Usuários podem ver anexos de conversas das quais participam
CREATE POLICY "Users can view chat attachments from their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- É o remetente ou receptor em alguma mensagem relacionada
    EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE (cm.sender_id = auth.uid() OR cm.receiver_id = auth.uid())
      AND name LIKE '%' || cm.request_id || '%'
    )
  )
);

-- 3. Criar políticas de acesso para request-images
-- Clientes podem fazer upload de imagens de suas solicitações
CREATE POLICY "Clients can upload request images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-images'
  AND EXISTS (
    SELECT 1 FROM service_requests sr
    WHERE sr.client_id = auth.uid()
    AND name LIKE '%' || sr.id || '%'
  )
);

-- Clientes podem ver imagens de suas próprias solicitações
CREATE POLICY "Clients can view own request images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-images'
  AND EXISTS (
    SELECT 1 FROM service_requests sr
    WHERE sr.client_id = auth.uid()
    AND name LIKE '%' || sr.id || '%'
  )
);

-- Profissionais podem ver imagens de solicitações nas quais fizeram orçamentos
CREATE POLICY "Professionals can view request images after quoting"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'request-images'
  AND EXISTS (
    SELECT 1 FROM service_requests sr
    JOIN quotes q ON q.request_id = sr.id
    WHERE q.professional_id = auth.uid()
    AND name LIKE '%' || sr.id || '%'
  )
);