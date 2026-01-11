
-- Tabela para armazenar fotos dos projetos
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_project_photos_type ON project_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_project_photos_stage ON project_photos(stage);

-- Habilitar RLS
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_project_photos_updated_at()
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
  EXECUTE FUNCTION update_project_photos_updated_at();

-- Tabela para mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- RLS para chat
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
CREATE POLICY "Anyone can view chat messages" ON chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;
CREATE POLICY "Anyone can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);
