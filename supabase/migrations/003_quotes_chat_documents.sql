-- =====================================================
-- ELITE TRACK - MIGRAÇÃO 003
-- Tabelas para: Orçamentos (quotes), Chat, Documentos
-- Execute este script no SQL Editor do dashboard do Supabase
-- =====================================================

-- =====================================================
-- TABELA: quotes (Orçamentos de clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  vehicle_type VARCHAR(50),
  vehicle_brand VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year VARCHAR(10),
  vehicle_plate VARCHAR(20),
  blinding_level VARCHAR(20),
  service_type VARCHAR(50) NOT NULL,
  service_description TEXT,
  client_description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  estimated_price VARCHAR(50),
  estimated_days INTEGER,
  executor_notes TEXT,
  executor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  executor_name VARCHAR(255),
  client_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para quotes
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- =====================================================
-- TABELA: chat_conversations (Conversas de chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id ON chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);

-- =====================================================
-- TABELA: chat_messages (Mensagens de chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name VARCHAR(255),
  sender_role VARCHAR(50),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  attachment_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- =====================================================
-- TABELA: client_documents (Documentos do cliente)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(50),
  url TEXT,
  category VARCHAR(50) DEFAULT 'other',
  status VARCHAR(20) DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Índices para client_documents
CREATE INDEX IF NOT EXISTS idx_client_documents_user_id ON client_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_project_id ON client_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_category ON client_documents(category);

-- =====================================================
-- TABELA: revisions (Revisões agendadas)
-- =====================================================
CREATE TABLE IF NOT EXISTS revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  scheduled_date DATE,
  scheduled_time VARCHAR(20),
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para revisions
CREATE INDEX IF NOT EXISTS idx_revisions_project_id ON revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_revisions_user_id ON revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON revisions(status);

-- =====================================================
-- RLS (Row Level Security) - Políticas de segurança
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

-- Políticas para quotes
CREATE POLICY "Usuarios podem ver seus proprios orcamentos" ON quotes
  FOR SELECT USING (client_email = current_setting('app.user_email', true));

CREATE POLICY "Usuarios podem criar orcamentos" ON quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Executores podem ver todos os orcamentos" ON quotes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('executor', 'admin'))
  );

-- Políticas para chat_conversations
CREATE POLICY "Usuarios podem ver suas conversas" ON chat_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem criar conversas" ON chat_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para chat_messages
CREATE POLICY "Usuarios podem ver mensagens de suas conversas" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "Usuarios podem enviar mensagens" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
  );

-- Políticas para client_documents
CREATE POLICY "Usuarios podem ver seus documentos" ON client_documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem enviar documentos" ON client_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios podem deletar seus documentos" ON client_documents
  FOR DELETE USING (user_id = auth.uid());

-- Políticas para revisions
CREATE POLICY "Usuarios podem ver suas revisoes" ON revisions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem agendar revisoes" ON revisions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios podem atualizar suas revisoes" ON revisions
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revisions_updated_at
  BEFORE UPDATE ON revisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
