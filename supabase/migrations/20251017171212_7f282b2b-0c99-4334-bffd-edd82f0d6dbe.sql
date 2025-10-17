-- Fase 1: Criar tabelas

-- 1.1 Tabela de categorias de serviço
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO service_categories (name, description, icon) VALUES
  ('Hidráulica', 'Reparos em encanamentos, torneiras, vazamentos', 'droplet'),
  ('Elétrica', 'Instalações elétricas, tomadas, disjuntores', 'zap'),
  ('Limpeza', 'Limpeza residencial e comercial', 'sparkles'),
  ('Pintura', 'Pintura residencial e comercial', 'paint-brush'),
  ('Jardinagem', 'Manutenção de jardins e áreas verdes', 'tree'),
  ('Marcenaria', 'Móveis planejados e reparos', 'hammer');

-- 1.2 Tabela de solicitações de serviço
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Uberlândia',
  state TEXT NOT NULL DEFAULT 'MG',
  urgency_level INTEGER DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 3),
  preferred_date DATE,
  budget_estimate NUMERIC(10,2),
  images_urls TEXT[],
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_requests_client ON service_requests(client_id);
CREATE INDEX idx_service_requests_category ON service_requests(category_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- 1.3 Tabela de orçamentos
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  estimated_time TEXT,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_request ON quotes(request_id);
CREATE INDEX idx_quotes_professional ON quotes(professional_id);

-- 1.4 Tabela de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- 1.5 Tabela de mensagens de chat
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_request ON chat_messages(request_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);

-- 1.6 Tabela de avaliações
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_professional ON reviews(professional_id);

-- 1.7 Tabela de especialidades de profissionais
CREATE TABLE professional_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, category_id)
);

CREATE INDEX idx_professional_specialties_professional ON professional_specialties(professional_id);
CREATE INDEX idx_professional_specialties_category ON professional_specialties(category_id);

-- Fase 2: Configurar Row Level Security (RLS)

-- 2.1 RLS para service_categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON service_categories
  FOR SELECT USING (true);

-- 2.2 RLS para service_requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own requests" ON service_requests
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own requests" ON service_requests
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Professionals can view pending requests" ON service_requests
  FOR SELECT USING (status = 'pending');

CREATE POLICY "Professionals can view quoted requests" ON service_requests
  FOR SELECT USING (
    id IN (
      SELECT request_id FROM quotes WHERE professional_id = auth.uid()
    )
  );

-- 2.3 RLS para quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can create quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can view own quotes" ON quotes
  FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Clients can view quotes for their requests" ON quotes
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM service_requests WHERE client_id = auth.uid()
    )
  );

-- 2.4 RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 2.5 RLS para chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 2.6 RLS para reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Reviewers can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 2.7 RLS para professional_specialties
ALTER TABLE professional_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view specialties" ON professional_specialties
  FOR SELECT USING (true);

CREATE POLICY "Professionals can manage own specialties" ON professional_specialties
  FOR ALL USING (auth.uid() = professional_id);

-- Fase 3: Criar triggers para updated_at

CREATE TRIGGER on_service_request_updated
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_notification_updated
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Fase 4: Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Fase 5: Criar Storage Bucket para imagens de serviços
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Policy para upload de imagens
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy para visualizar imagens
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');