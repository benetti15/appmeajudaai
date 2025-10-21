-- Allow professionals with accepted quotes to update service request status
CREATE POLICY "Professionals can update accepted requests"
ON service_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.request_id = service_requests.id
    AND quotes.professional_id = auth.uid()
    AND quotes.is_accepted = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.request_id = service_requests.id
    AND quotes.professional_id = auth.uid()
    AND quotes.is_accepted = true
  )
);