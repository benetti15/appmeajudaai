-- Criar funções de segurança definer para evitar recursão infinita nas políticas RLS

-- Função para verificar se o usuário é o cliente de uma solicitação
CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_requests
    WHERE id = _request_id
      AND client_id = _user_id
  );
$$;

-- Função para verificar se o profissional tem uma quote para a solicitação
CREATE OR REPLACE FUNCTION public.has_quote_for_request(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM quotes
    WHERE request_id = _request_id
      AND professional_id = _user_id
  );
$$;

-- Remover políticas existentes que causam recursão
DROP POLICY IF EXISTS "Professionals can view quoted requests" ON service_requests;
DROP POLICY IF EXISTS "Clients can view quotes for their requests" ON quotes;

-- Recriar políticas usando as funções de security definer

-- Política para profissionais verem solicitações nas quais enviaram orçamentos
CREATE POLICY "Professionals can view quoted requests"
ON service_requests
FOR SELECT
USING (
  public.has_quote_for_request(id, auth.uid())
);

-- Política para clientes verem orçamentos de suas solicitações
CREATE POLICY "Clients can view quotes for their requests"
ON quotes
FOR SELECT
USING (
  public.is_request_client(request_id, auth.uid())
);