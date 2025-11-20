-- Garantir que o bucket request-images existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para request-images
DO $$ 
BEGIN
  -- Policy para upload (apenas usuários autenticados)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Usuários podem fazer upload de imagens de solicitação'
  ) THEN
    CREATE POLICY "Usuários podem fazer upload de imagens de solicitação"
    ON storage.objects FOR INSERT 
    TO authenticated
    WITH CHECK (bucket_id = 'request-images');
  END IF;

  -- Policy para leitura pública
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Imagens de solicitação são públicas'
  ) THEN
    CREATE POLICY "Imagens de solicitação são públicas"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'request-images');
  END IF;
END $$;