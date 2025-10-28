-- Drop e recriar a política de update para profissionais de forma mais robusta
DROP POLICY IF EXISTS "Professionals can update accepted requests" ON public.service_requests;

-- Nova política mais permissiva para profissionais com quote aceito
CREATE POLICY "Professionals can update accepted requests" 
ON public.service_requests 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.quotes 
    WHERE quotes.request_id = service_requests.id 
      AND quotes.professional_id = auth.uid() 
      AND quotes.is_accepted = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.quotes 
    WHERE quotes.request_id = service_requests.id 
      AND quotes.professional_id = auth.uid() 
      AND quotes.is_accepted = true
  )
);

-- Garantir que o campo extended_status existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'service_requests' 
      AND column_name = 'extended_status'
  ) THEN
    ALTER TABLE public.service_requests 
    ADD COLUMN extended_status TEXT;
  END IF;
END $$;