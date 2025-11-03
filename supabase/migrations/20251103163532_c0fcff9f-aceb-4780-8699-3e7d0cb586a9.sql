-- Adicionar coluna display_order à tabela professional_specialties
ALTER TABLE professional_specialties 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Popular coluna com ordem sequencial baseada em created_at
WITH ordered_specialties AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY professional_id ORDER BY created_at) - 1 as new_order
  FROM professional_specialties
)
UPDATE professional_specialties ps
SET display_order = os.new_order
FROM ordered_specialties os
WHERE ps.id = os.id;