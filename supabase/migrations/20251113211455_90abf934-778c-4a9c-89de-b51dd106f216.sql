-- Criar tabela de conversas do AI
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB[] DEFAULT ARRAY[]::JSONB[],
  context JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);

-- RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar tabela de memória do usuário
CREATE TABLE ai_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferences JSONB DEFAULT '{}'::JSONB,
  patterns JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_ai_user_memory_user_id ON ai_user_memory(user_id);

-- RLS Policies
ALTER TABLE ai_user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory"
  ON ai_user_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory"
  ON ai_user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory"
  ON ai_user_memory FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ai_conversations_timestamp
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversations_updated_at();

CREATE TRIGGER update_ai_user_memory_timestamp
  BEFORE UPDATE ON ai_user_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversations_updated_at();