-- =====================================================
-- ELITE TRACK - MIGRAÇÃO 009
-- Tabelas para fotos, chat e sincronização em real-time
-- =====================================================

-- 1. TABELA DE FOTOS DAS ETAPAS (TIMELINE)
CREATE TABLE IF NOT EXISTS step_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'during',
  stage TEXT,
  description TEXT,
  uploaded_by TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_photos_step ON step_photos(step_id);
CREATE INDEX IF NOT EXISTS idx_step_photos_project ON step_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_step_photos_type ON step_photos(photo_type);

ALTER TABLE step_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view step photos" ON step_photos;
CREATE POLICY "Anyone can view step photos" ON step_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert step photos" ON step_photos;
CREATE POLICY "Anyone can insert step photos" ON step_photos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update step photos" ON step_photos;
CREATE POLICY "Anyone can update step photos" ON step_photos FOR UPDATE USING (true);

-- 2. TABELA DE FOTOS DO PROJETO (GALERIA)
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
CREATE INDEX IF NOT EXISTS idx_project_photos_stage ON project_photos(stage);

ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);

-- 3. TABELA DE MENSAGENS DO CHAT
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
CREATE POLICY "Anyone can view chat messages" ON chat_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;
CREATE POLICY "Anyone can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update chat messages" ON chat_messages;
CREATE POLICY "Anyone can update chat messages" ON chat_messages FOR UPDATE USING (true);

-- 4. TABELA DE ANEXOS DO CHAT
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_name TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_conv ON chat_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON chat_attachments(message_id);

ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chat attachments" ON chat_attachments;
CREATE POLICY "Anyone can view chat attachments" ON chat_attachments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert chat attachments" ON chat_attachments;
CREATE POLICY "Anyone can insert chat attachments" ON chat_attachments FOR INSERT WITH CHECK (true);

-- 5. TABELA DE ANEXOS DE ORÇAMENTOS
CREATE TABLE IF NOT EXISTS quote_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_name TEXT,
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_attachments_quote ON quote_attachments(quote_id);

ALTER TABLE quote_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view quote attachments" ON quote_attachments;
CREATE POLICY "Anyone can view quote attachments" ON quote_attachments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert quote attachments" ON quote_attachments;
CREATE POLICY "Anyone can insert quote attachments" ON quote_attachments FOR INSERT WITH CHECK (true);

-- 6. TABELA DE LAUDOS ELITESHIELD
CREATE TABLE IF NOT EXISTS eliteshield_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Dados do veículo
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  vehicle_color TEXT,
  vehicle_plate TEXT,
  vehicle_chassis TEXT,
  vehicle_km_checkin INTEGER,
  vehicle_type TEXT,
  
  -- Dados do cliente
  client_name TEXT,
  client_document TEXT,
  client_phone TEXT,
  client_email TEXT,
  client_city TEXT,
  client_state TEXT,
  client_address TEXT,
  
  -- Especificações de blindagem
  blinding_line JSONB,
  protection_level TEXT DEFAULT 'NIJ III-A',
  usage_type TEXT DEFAULT 'Executivo',
  glass_thickness_mm INTEGER,
  glass_warranty_years INTEGER,
  glass_lot_number TEXT,
  aramid_layers TEXT,
  complement_material TEXT,
  
  -- Áreas protegidas
  protected_areas TEXT[],
  
  -- Fotos
  cover_photo_url TEXT,
  photos JSONB,
  
  -- Execução
  execution_steps JSONB,
  tests_approved BOOLEAN DEFAULT FALSE,
  tests_checklist JSONB,
  
  -- Responsáveis
  technical_responsible JSONB,
  supervisor JSONB,
  technical_signature_url TEXT,
  supervisor_signature_url TEXT,
  
  -- Garantias
  warranties JSONB,
  
  -- QR Code e rastreabilidade
  qr_code_url TEXT,
  trace_token TEXT,
  
  -- Observações e declaração
  technical_observations TEXT,
  recommendations TEXT,
  final_declaration TEXT,
  declaration_accepted BOOLEAN DEFAULT FALSE,
  declaration_date TIMESTAMPTZ,
  
  -- Status do documento
  issue_date DATE,
  completion_date DATE,
  document_version TEXT DEFAULT '1.0',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_eliteshield_project ON eliteshield_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_eliteshield_status ON eliteshield_reports(status);
CREATE INDEX IF NOT EXISTS idx_eliteshield_trace ON eliteshield_reports(trace_token);

ALTER TABLE eliteshield_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view eliteshield reports" ON eliteshield_reports;
CREATE POLICY "Anyone can view eliteshield reports" ON eliteshield_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert eliteshield reports" ON eliteshield_reports;
CREATE POLICY "Anyone can insert eliteshield reports" ON eliteshield_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update eliteshield reports" ON eliteshield_reports;
CREATE POLICY "Anyone can update eliteshield reports" ON eliteshield_reports FOR UPDATE USING (true);

-- 7. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS step_photos_updated_at ON step_photos;
CREATE TRIGGER step_photos_updated_at
  BEFORE UPDATE ON step_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS project_photos_updated_at ON project_photos;
CREATE TRIGGER project_photos_updated_at
  BEFORE UPDATE ON project_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS eliteshield_reports_updated_at ON eliteshield_reports;
CREATE TRIGGER eliteshield_reports_updated_at
  BEFORE UPDATE ON eliteshield_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. HABILITAR REALTIME NAS TABELAS
ALTER PUBLICATION supabase_realtime ADD TABLE step_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE project_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE eliteshield_reports;
