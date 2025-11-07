-- Adicionar campos de endereço estruturado na tabela profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS formatted_address text;

-- Adicionar campos de endereço estruturado na tabela service_requests
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS formatted_address text;

-- Criar função para formatar endereço automaticamente
CREATE OR REPLACE FUNCTION format_address_auto(
  p_street text,
  p_number text,
  p_neighborhood text,
  p_city text,
  p_state text
) RETURNS text AS $$
BEGIN
  RETURN CONCAT_WS(', ',
    NULLIF(CONCAT_WS(' ', p_street, p_number), ''),
    NULLIF(p_neighborhood, ''),
    NULLIF(p_city, ''),
    NULLIF(p_state, '')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para auto-formatar endereço em profiles
CREATE OR REPLACE FUNCTION update_formatted_address_profiles()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS format_address_profiles_trigger ON profiles;
CREATE TRIGGER format_address_profiles_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_formatted_address_profiles();

-- Trigger para auto-formatar endereço em service_requests
CREATE OR REPLACE FUNCTION update_formatted_address_requests()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS format_address_requests_trigger ON service_requests;
CREATE TRIGGER format_address_requests_trigger
  BEFORE INSERT OR UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_formatted_address_requests();

-- Atualizar formatted_address para registros existentes
UPDATE profiles 
SET formatted_address = format_address_auto(street, number, neighborhood, city, state)
WHERE formatted_address IS NULL;

UPDATE service_requests 
SET formatted_address = format_address_auto(street, number, neighborhood, city, state)
WHERE formatted_address IS NULL;