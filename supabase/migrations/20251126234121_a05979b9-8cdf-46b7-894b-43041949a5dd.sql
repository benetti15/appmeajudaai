-- Fase 3.1: Adicionar política UPDATE para chat_messages
-- Permite que usuários marquem mensagens recebidas como lidas

CREATE POLICY "Users can update received messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);