-- Política RLS para permitir clientes aceitarem orçamentos
CREATE POLICY "Clients can accept quotes for their requests" 
ON quotes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM service_requests 
    WHERE service_requests.id = quotes.request_id 
    AND service_requests.client_id = auth.uid()
  )
);

-- Corrigir o dado inconsistente existente
UPDATE quotes 
SET is_accepted = true 
WHERE request_id = '6885f749-c5ad-414c-a94c-9ffd7e888e61' 
AND is_accepted = false;