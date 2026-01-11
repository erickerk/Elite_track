-- Tabela de conversas do chat
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON chat_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_msg ON chat_conversations(last_message_at);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chat conversations" ON chat_conversations;
CREATE POLICY "Anyone can view chat conversations" ON chat_conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert chat conversations" ON chat_conversations;
CREATE POLICY "Anyone can insert chat conversations" ON chat_conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update chat conversations" ON chat_conversations;
CREATE POLICY "Anyone can update chat conversations" ON chat_conversations FOR UPDATE USING (true);

-- Adicionar coluna content na tabela chat_messages se não existir
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
    ALTER TABLE chat_messages ADD COLUMN conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'read'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Habilitar realtime nas tabelas de chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
