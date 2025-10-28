-- Create table for real-time professional location tracking
CREATE TABLE IF NOT EXISTS public.professional_live_location (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.professional_live_location ENABLE ROW LEVEL SECURITY;

-- Policy: Professionals can insert and update their own location
CREATE POLICY "Professionals can manage their location"
ON public.professional_live_location
FOR ALL
USING (auth.uid() = professional_id)
WITH CHECK (auth.uid() = professional_id);

-- Policy: Clients can view location for their requests
CREATE POLICY "Clients can view professional location for their requests"
ON public.professional_live_location
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_requests
    WHERE service_requests.id = professional_live_location.request_id
    AND service_requests.client_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_live_location_request ON public.professional_live_location(request_id);
CREATE INDEX idx_live_location_professional ON public.professional_live_location(professional_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_professional_live_location_updated_at
BEFORE UPDATE ON public.professional_live_location
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for live location tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_live_location;