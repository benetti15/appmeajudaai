-- Adicionar novas categorias de serviço
INSERT INTO service_categories (name, description, icon, is_active) VALUES
('Montagem e Instalações', 'Montagem de móveis, instalação de prateleiras, suportes e outros itens', 'package', true),
('Eletrodomésticos', 'Instalação, manutenção e pequenos reparos em eletrodomésticos', 'refrigerator', true)
ON CONFLICT DO NOTHING;