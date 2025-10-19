-- Adicionar campos de experiência e descrição para especialidades profissionais
ALTER TABLE professional_specialties
ADD COLUMN experience_years INTEGER,
ADD COLUMN description TEXT,
ADD COLUMN certifications TEXT,
ADD COLUMN hourly_rate DECIMAL(10,2);

-- Adicionar comentários para documentação
COMMENT ON COLUMN professional_specialties.experience_years IS 'Anos de experiência do profissional nesta especialidade';
COMMENT ON COLUMN professional_specialties.description IS 'Descrição detalhada da experiência e trabalhos realizados';
COMMENT ON COLUMN professional_specialties.certifications IS 'Certificações e qualificações relacionadas';
COMMENT ON COLUMN professional_specialties.hourly_rate IS 'Valor por hora cobrado nesta especialidade (opcional)';