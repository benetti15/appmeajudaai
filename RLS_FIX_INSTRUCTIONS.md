# Resolução do Problema de RLS - Service Request Status

## Problema Identificado
O erro ocorre porque as políticas RLS (Row Level Security) do Supabase não permitem que profissionais atualizem o status dos serviços. A policy existente apenas permite que clientes atualizem seus próprios pedidos.

## Solução
Execute o SQL abaixo no painel do Supabase para criar uma função que contorna o problema de RLS:

```sql
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
```

## Ou Adicionar Policy RLS Alternativa

Se preferir usar policies RLS ao invés da função, execute:

```sql
-- Allow professionals to update status of service requests they have accepted quotes for
CREATE POLICY "Professionals can update service status for accepted quotes" 
ON public.service_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.request_id = service_requests.id 
    AND q.professional_id = auth.uid() 
    AND q.is_accepted = true
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.request_id = service_requests.id 
    AND q.professional_id = auth.uid() 
    AND q.is_accepted = true
  )
);
```

## Como Aplicar

1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Execute uma das queries acima
4. Teste o sistema novamente

O código já foi atualizado para funcionar melhor com as limitações atuais do RLS.