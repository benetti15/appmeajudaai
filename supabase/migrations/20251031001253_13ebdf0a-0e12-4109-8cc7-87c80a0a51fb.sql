-- Corrigir função de validação para incluir search_path
DROP FUNCTION IF EXISTS validate_status_transition() CASCADE;

CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Não permitir in_progress se status atual não for accepted
  IF NEW.status = 'in_progress' AND OLD.status != 'accepted' THEN
    RAISE EXCEPTION 'Status só pode ser mudado para in_progress quando o status atual é accepted';
  END IF;
  
  -- Não permitir accepted se não houver orçamento aceito
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    IF NOT EXISTS (
      SELECT 1 FROM quotes 
      WHERE request_id = NEW.id AND is_accepted = true
    ) THEN
      RAISE EXCEPTION 'Status só pode ser mudado para accepted quando há um orçamento aceito';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS enforce_status_transition ON service_requests;

CREATE TRIGGER enforce_status_transition
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_status_transition();