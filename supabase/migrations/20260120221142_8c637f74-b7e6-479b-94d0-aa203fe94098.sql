-- Drop the restrictive policy
DROP POLICY IF EXISTS "Verified professionals can create quotes" ON public.quotes;

-- Create a more permissive policy that allows any professional to create quotes
CREATE POLICY "Professionals can create quotes"
ON public.quotes
FOR INSERT
WITH CHECK (
  auth.uid() = professional_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'professional'
  )
);