-- ============================================
-- GARANTIR BUCKETS DE STORAGE PARA UPLOADS
-- ============================================

-- Criar bucket 'uploads' se não existir (para chat e reviews)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem e criar novas
DROP POLICY IF EXISTS "Public access to uploads" ON storage.objects;
CREATE POLICY "Public access to uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Garantir que service-images também tem as políticas corretas
DROP POLICY IF EXISTS "Public access to service images" ON storage.objects;
CREATE POLICY "Public access to service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Authenticated users can upload service images" ON storage.objects;
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
);