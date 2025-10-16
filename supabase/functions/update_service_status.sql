-- Function to update service status bypassing RLS
CREATE OR REPLACE FUNCTION update_service_status(
  request_id UUID,
  new_status TEXT,
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission (either client or professional with accepted quote)
  IF EXISTS (
    SELECT 1 FROM service_requests sr WHERE sr.id = request_id AND sr.client_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM service_requests sr
    JOIN quotes q ON q.request_id = sr.id
    WHERE sr.id = request_id AND q.professional_id = user_id AND q.is_accepted = true
  ) THEN
    -- Update the status
    UPDATE service_requests 
    SET status = new_status::service_status, updated_at = NOW()
    WHERE id = request_id;
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'User does not have permission to update this service request';
  END IF;
END;
$$;