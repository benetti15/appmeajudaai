-- Criar tabela de favoritos
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, professional_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para favoritos
CREATE POLICY "Users can view their own favorites" 
ON public.favorites
FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own favorites" 
ON public.favorites
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorites
FOR DELETE 
USING (auth.uid() = client_id);

-- Adicionar coluna avatar_url aos profiles (se não existir)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Adicionar coluna category_id aos service_requests (se não existir)
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS category_id_backup UUID REFERENCES public.service_categories(id);

-- Adicionar receiver_id aos chat_messages (campo obrigatório que estava faltando)
-- Criar uma função trigger para preencher automaticamente o receiver_id
CREATE OR REPLACE FUNCTION public.set_chat_receiver()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_professional_id UUID;
BEGIN
  -- Buscar IDs do cliente e profissional aceito da solicitação
  SELECT 
    sr.client_id,
    q.professional_id INTO v_client_id, v_professional_id
  FROM service_requests sr
  LEFT JOIN quotes q ON q.request_id = sr.id AND q.is_accepted = true
  WHERE sr.id = NEW.request_id
  LIMIT 1;
  
  -- Definir receiver_id como o outro participante da conversa
  IF NEW.sender_id = v_client_id THEN
    NEW.receiver_id := v_professional_id;
  ELSE
    NEW.receiver_id := v_client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para preencher receiver_id automaticamente
DROP TRIGGER IF EXISTS set_chat_receiver_trigger ON public.chat_messages;
CREATE TRIGGER set_chat_receiver_trigger
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_receiver();

-- Adicionar campo images_urls à tabela reviews (se não existir)
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS images_urls TEXT[];

-- Adicionar materials_included à tabela quotes (se não existir)
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS materials_included BOOLEAN DEFAULT false;

-- Índices para melhor performance em favoritos
CREATE INDEX IF NOT EXISTS idx_favorites_client_id ON public.favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_favorites_professional_id ON public.favorites(professional_id);