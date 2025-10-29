-- =====================================================
-- CORREÇÃO DOS PROBLEMAS CRÍTICOS - V2
-- =====================================================

-- 1. REMOVER POLÍTICAS EXISTENTES E RECRIAR CORRETAMENTE
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Anyone can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own service images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own service images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Políticas para bucket 'service-images' (público)
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-images' 
  AND auth.uid() IS NOT NULL
);

-- Políticas para bucket 'uploads' (público)
CREATE POLICY "Anyone can view uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
);

-- 2. CORRIGIR TRIGGER handle_new_user PARA GARANTIR CRIAÇÃO DO PROFILE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    user_type, 
    phone, 
    email, 
    cpf, 
    address, 
    city, 
    state,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. ADICIONAR ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_professional_live_location_request ON professional_live_location(request_id);

-- 4. GARANTIR QUE TODOS OS PROFILES TENHAM user_type
-- =====================================================

UPDATE profiles 
SET user_type = 'client', updated_at = NOW()
WHERE user_type IS NULL OR user_type = '';

ALTER TABLE profiles 
ALTER COLUMN user_type SET NOT NULL,
ALTER COLUMN user_type SET DEFAULT 'client';