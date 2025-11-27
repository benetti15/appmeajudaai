-- Create verification documents table
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('id', 'address', 'professional', 'background')),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professional_id, document_type)
);

-- Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own documents
CREATE POLICY "Professionals can view own documents"
ON public.verification_documents
FOR SELECT
USING (auth.uid() = professional_id);

-- Professionals can insert their own documents
CREATE POLICY "Professionals can upload documents"
ON public.verification_documents
FOR INSERT
WITH CHECK (auth.uid() = professional_id);

-- Create verification status table
CREATE TABLE IF NOT EXISTS public.professional_verification_status (
  professional_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level TEXT DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'partial', 'verified')),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.professional_verification_status ENABLE ROW LEVEL SECURITY;

-- Anyone can view verification status (public info)
CREATE POLICY "Anyone can view verification status"
ON public.professional_verification_status
FOR SELECT
USING (true);

-- Users can insert their own status
CREATE POLICY "Users can insert own status"
ON public.professional_verification_status
FOR INSERT
WITH CHECK (auth.uid() = professional_id);

-- Function to update verification status based on approved documents
CREATE OR REPLACE FUNCTION public.update_verification_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  approved_count INT;
  total_required INT := 2; -- At least ID and one other document
BEGIN
  -- Count approved documents for this professional
  SELECT COUNT(*) INTO approved_count
  FROM public.verification_documents
  WHERE professional_id = NEW.professional_id
    AND status = 'approved';
  
  -- Update or insert verification status
  INSERT INTO public.professional_verification_status (
    professional_id,
    is_verified,
    verification_level,
    verified_at,
    updated_at
  )
  VALUES (
    NEW.professional_id,
    approved_count >= total_required,
    CASE
      WHEN approved_count = 0 THEN 'unverified'
      WHEN approved_count < total_required THEN 'partial'
      ELSE 'verified'
    END,
    CASE WHEN approved_count >= total_required THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (professional_id)
  DO UPDATE SET
    is_verified = EXCLUDED.is_verified,
    verification_level = EXCLUDED.verification_level,
    verified_at = EXCLUDED.verified_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger to update verification status when documents are approved
CREATE TRIGGER update_verification_status_trigger
AFTER INSERT OR UPDATE ON public.verification_documents
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION public.update_verification_status();

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for verification documents storage
CREATE POLICY "Professionals can upload own verification docs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Professionals can view own verification docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update service_requests policies to require verification
DROP POLICY IF EXISTS "Professionals can view quoted requests" ON public.service_requests;

CREATE POLICY "Verified professionals can view quoted requests"
ON public.service_requests
FOR SELECT
USING (
  has_quote_for_request(id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.professional_verification_status
    WHERE professional_id = auth.uid()
      AND is_verified = true
  )
);

-- Update the progressive view policy
DROP POLICY IF EXISTS "Professionals can view requests progressively" ON public.service_requests;

CREATE POLICY "Verified professionals can view requests progressively"
ON public.service_requests
FOR SELECT
USING (
  (status = 'pending'::text) 
  OR has_quote_for_request(id, auth.uid())
  OR (auth.uid() = client_id)
  OR (
    EXISTS (
      SELECT 1 FROM public.professional_verification_status
      WHERE professional_id = auth.uid()
        AND is_verified = true
    )
  )
);

-- Restrict chat access to verified professionals
DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;

CREATE POLICY "Users can view their messages"
ON public.chat_messages
FOR SELECT
USING (
  (auth.uid() = sender_id) 
  OR (
    auth.uid() = receiver_id 
    AND (
      -- Clients can always view
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'client')
      OR
      -- Professionals must be verified
      EXISTS (
        SELECT 1 FROM public.professional_verification_status
        WHERE professional_id = auth.uid()
          AND is_verified = true
      )
    )
  )
);

-- Restrict quote creation to verified professionals
DROP POLICY IF EXISTS "Professionals can create quotes" ON public.quotes;

CREATE POLICY "Verified professionals can create quotes"
ON public.quotes
FOR INSERT
WITH CHECK (
  auth.uid() = professional_id
  AND EXISTS (
    SELECT 1 FROM public.professional_verification_status
    WHERE professional_id = auth.uid()
      AND is_verified = true
  )
);

-- Update trigger for verification documents
CREATE OR REPLACE FUNCTION public.handle_verification_document_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER verification_documents_updated_at
BEFORE UPDATE ON public.verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_verification_document_update();