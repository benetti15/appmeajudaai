-- Fix search_path for update_ai_feedback_updated_at function
DROP FUNCTION IF EXISTS public.update_ai_feedback_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_ai_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public';

-- Recreate the trigger
CREATE TRIGGER update_ai_feedback_updated_at
  BEFORE UPDATE ON public.ai_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_feedback_updated_at();