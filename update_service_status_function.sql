-- Function to update service request status with proper authorization checks
CREATE OR REPLACE FUNCTION update_service_request_status(
  request_id_param UUID,
  new_status_param request_status,
  completion_notes_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  status request_status,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID;
  is_professional BOOLEAN := false;
  is_client BOOLEAN := false;
  has_accepted_quote BOOLEAN := false;
BEGIN
  -- Get current user ID
  user_id_var := auth.uid();
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is the client for this request
  SELECT EXISTS(
    SELECT 1 FROM service_requests sr 
    WHERE sr.id = request_id_param AND sr.client_id = user_id_var
  ) INTO is_client;
  
  -- Check if user is a professional with accepted quote for this request
  SELECT EXISTS(
    SELECT 1 FROM quotes q 
    WHERE q.request_id = request_id_param 
    AND q.professional_id = user_id_var 
    AND q.is_accepted = true
  ) INTO has_accepted_quote;
  
  -- Authorization check
  IF NOT (is_client OR has_accepted_quote) THEN
    RAISE EXCEPTION 'User not authorized to update this service request';
  END IF;
  
  -- Update the service request
  UPDATE service_requests 
  SET 
    status = new_status_param,
    completion_notes = COALESCE(completion_notes_param, completion_notes),
    updated_at = NOW()
  WHERE service_requests.id = request_id_param;
  
  -- Return updated record
  RETURN QUERY
  SELECT 
    service_requests.id,
    service_requests.status,
    service_requests.updated_at
  FROM service_requests 
  WHERE service_requests.id = request_id_param;
END;
$$;