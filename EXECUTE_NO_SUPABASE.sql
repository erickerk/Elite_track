-- =====================================================
-- ELITE TRACK - SQL CONSOLIDADO PARA PRODUÇÃO
-- Execute este arquivo no Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql
-- =====================================================

-- 1. TABELA DE FOTOS DO PROJETO
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'general',
  stage TEXT,
  description TEXT,
  taken_by TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_type ON project_photos(photo_type);

ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);

-- 2. ATUALIZAR TABELA DE CONVERSAS DO CHAT (adicionar colunas se não existirem)
DO $$
BEGIN
  -- Adicionar coluna user_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_conversations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN user_id TEXT;
  END IF;
  
  -- Adicionar coluna title se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_conversations' AND column_name = 'title'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN title TEXT;
  END IF;
  
  -- Adicionar coluna unread_count se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_conversations' AND column_name = 'unread_count'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
  END IF;
  
  -- Adicionar coluna last_message_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_conversations' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);

-- Habilitar RLS se não estiver habilitado
DO $$
BEGIN
  ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Criar/atualizar políticas de RLS
DROP POLICY IF EXISTS "Anyone can view chat conversations" ON chat_conversations;
CREATE POLICY "Anyone can view chat conversations" ON chat_conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert chat conversations" ON chat_conversations;
CREATE POLICY "Anyone can insert chat conversations" ON chat_conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update chat conversations" ON chat_conversations;
CREATE POLICY "Anyone can update chat conversations" ON chat_conversations FOR UPDATE USING (true);

-- 3. ATUALIZAR TABELA CHAT_MESSAGES (se necessário)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'content'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN content TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN conversation_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'read'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 4. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_photos_updated_at ON project_photos;
CREATE TRIGGER project_photos_updated_at
  BEFORE UPDATE ON project_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR REALTIME (pode dar erro se já estiver habilitado, ignorar)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE project_photos;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE step_photos;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 6. VERIFICAÇÃO FINAL
SELECT 
  'project_photos' as tabela,
  (SELECT COUNT(*) FROM project_photos) as registros
UNION ALL
SELECT 
  'chat_conversations' as tabela,
  (SELECT COUNT(*) FROM chat_conversations) as registros
UNION ALL
SELECT 
  'chat_messages' as tabela,
  (SELECT COUNT(*) FROM chat_messages) as registros
UNION ALL
SELECT 
  'step_photos' as tabela,
  (SELECT COUNT(*) FROM step_photos) as registros;

-- =====================================================
-- FIM DO SCRIPT
-- Após executar, as tabelas estarão prontas para uso
-- =====================================================
