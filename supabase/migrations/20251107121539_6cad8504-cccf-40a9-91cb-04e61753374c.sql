-- Corrigir search_path das funções criadas para segurança

-- Recriar função format_address_auto com search_path
CREATE OR REPLACE FUNCTION format_address_auto(
  p_street text,
  p_number text,
  p_neighborhood text,
  p_city text,
  p_state text
) RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CONCAT_WS(', ',
    NULLIF(CONCAT_WS(' ', p_street, p_number), ''),
    NULLIF(p_neighborhood, ''),
    NULLIF(p_city, ''),
    NULLIF(p_state, '')
  );
END;
$$;

-- Recriar função update_formatted_address_profiles com search_path
CREATE OR REPLACE FUNCTION update_formatted_address_profiles()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.formatted_address := format_address_auto(
    NEW.street,
    NEW.number,
    NEW.neighborhood,
    NEW.city,
    NEW.state
  );
  RETURN NEW;
END;
$$;

-- Recriar função update_formatted_address_requests com search_path
CREATE OR REPLACE FUNCTION update_formatted_address_requests()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.formatted_address := format_address_auto(
    NEW.street,
    NEW.number,
    NEW.neighborhood,
    NEW.city,
    NEW.state
  );
  RETURN NEW;
END;
$$;