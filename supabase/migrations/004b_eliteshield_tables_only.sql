-- =====================================================
-- MIGRAÇÃO 004B: TABELAS DO LAUDO ELITESHIELD™
-- Elite Track - Apenas Tabelas (Usuários já criados)
-- Data: 2025-01-10
-- =====================================================

-- =====================================================
-- PARTE 1: PROTEÇÃO DO ADMIN MASTER
-- =====================================================

-- Trigger para impedir exclusão do Admin Master
CREATE OR REPLACE FUNCTION protect_admin_master()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email = 'juniorrodrigues1011@gmail.com' THEN
    RAISE EXCEPTION 'O Admin Master não pode ser excluído!';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_admin_master_delete ON users_elitetrack;
CREATE TRIGGER prevent_admin_master_delete
  BEFORE DELETE ON users_elitetrack
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_master();

-- Trigger para impedir desativação do Admin Master
CREATE OR REPLACE FUNCTION protect_admin_master_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'juniorrodrigues1011@gmail.com' AND NEW.is_active = false THEN
    RAISE EXCEPTION 'O Admin Master não pode ser desativado!';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_admin_master_deactivation ON users_elitetrack;
CREATE TRIGGER prevent_admin_master_deactivation
  BEFORE UPDATE ON users_elitetrack
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_master_deactivation();

-- =====================================================
-- PARTE 2: TABELAS DO LAUDO ELITESHIELD™
-- =====================================================

-- Tabela: Linhas de Blindagem (padrão para todos)
CREATE TABLE IF NOT EXISTS blinding_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  protection_level VARCHAR(50) NOT NULL,
  usage_type VARCHAR(50),
  seal_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados padrão das linhas de blindagem
INSERT INTO blinding_lines (name, display_name, description, protection_level, usage_type, seal_name) VALUES
  ('ultralite_armor', 'UltraLite Armor™', 'Blindagem Ultra Leve com tecnologia de ponta', 'NIJ III-A', 'Executivo', 'Premium Technology'),
  ('safecore', 'SafeCore™', 'Segurança Inteligente com equilíbrio perfeito', 'NIJ III-A', 'Civil', 'Smart Balance'),
  ('elite_max', 'EliteMax™', 'Proteção máxima para VIPs', 'NIJ III', 'VIP', 'Maximum Protection')
ON CONFLICT DO NOTHING;

-- Tabela: Especificações de Vidros (padrão para todos)
CREATE TABLE IF NOT EXISTS glass_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  thickness_mm INTEGER NOT NULL,
  warranty_years INTEGER DEFAULT 10,
  certification VARCHAR(100),
  lot_number VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados padrão de vidros
INSERT INTO glass_specs (manufacturer, model, thickness_mm, warranty_years, certification) VALUES
  ('SafeMax', 'Premium 21mm', 21, 10, 'EN 1063 BR4'),
  ('SafeMax', 'Premium 38mm', 38, 10, 'EN 1063 BR4'),
  ('SafeMax', 'Premium 42mm', 42, 10, 'EN 1063 BR4'),
  ('Guardian', 'BallisticPro 25mm', 25, 8, 'NIJ 0108.01')
ON CONFLICT DO NOTHING;

-- Tabela: Materiais Opacos (padrão para todos)
CREATE TABLE IF NOT EXISTS opaque_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  layers_min INTEGER,
  layers_max INTEGER,
  certification VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados padrão de materiais opacos
INSERT INTO opaque_materials (name, type, manufacturer, layers_min, layers_max, certification) VALUES
  ('Kevlar Premium', 'Aramida', 'DuPont', 8, 11, 'NIJ 0108.01'),
  ('Tensylon Shield', 'Polietileno UHMWPE', 'NextOne', 6, 10, 'NIJ Level IIIA'),
  ('Hardox 500', 'Aço Balístico', 'SSAB', 1, 2, 'EN 1063')
ON CONFLICT DO NOTHING;

-- Tabela: Garantias Padrão (padrão para todos)
CREATE TABLE IF NOT EXISTS warranty_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  component VARCHAR(100) NOT NULL,
  duration_months INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados padrão de garantias
INSERT INTO warranty_types (name, component, duration_months, description) VALUES
  ('Garantia Vidros Blindados', 'Vidros', 120, '10 anos de garantia contra defeitos de fabricação'),
  ('Garantia Materiais Opacos', 'Opacos', 60, '5 anos de garantia contra defeitos de fabricação'),
  ('Garantia Acabamento', 'Acabamento', 12, '12 meses de garantia no acabamento interno')
ON CONFLICT DO NOTHING;

-- Tabela: Responsáveis Técnicos (por empresa)
CREATE TABLE IF NOT EXISTS technical_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  position VARCHAR(100) NOT NULL,
  registration VARCHAR(50),
  signature_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados padrão de responsáveis
INSERT INTO technical_responsibles (name, position, registration) VALUES
  ('Eng. Carlos Roberto Silva', 'Responsável Técnico', 'CREA 123456/SP'),
  ('Fernando Costa', 'Supervisor Técnico', 'CREA 789012/SP')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 3: TABELA PRINCIPAL DO LAUDO ELITESHIELD™
-- =====================================================

CREATE TABLE IF NOT EXISTS eliteshield_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  
  status VARCHAR(20) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  
  cover_photo_url TEXT,
  completion_date DATE,
  
  vehicle_brand VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  vehicle_color VARCHAR(50),
  vehicle_plate VARCHAR(20),
  vehicle_chassis VARCHAR(50),
  vehicle_km_checkin INTEGER,
  vehicle_type VARCHAR(50),
  
  client_name VARCHAR(200),
  client_document VARCHAR(20),
  client_phone VARCHAR(20),
  client_email VARCHAR(150),
  client_city VARCHAR(100),
  client_state VARCHAR(2),
  
  blinding_line_id UUID REFERENCES blinding_lines(id),
  protection_level VARCHAR(50),
  usage_type VARCHAR(50),
  
  glass_spec_id UUID REFERENCES glass_specs(id),
  glass_thickness_mm INTEGER,
  glass_warranty_years INTEGER,
  glass_lot_number VARCHAR(50),
  opaque_material_id UUID REFERENCES opaque_materials(id),
  aramid_layers INTEGER,
  complement_material VARCHAR(100),
  
  protected_areas JSONB DEFAULT '[]',
  
  tests_checklist JSONB DEFAULT '{}',
  tests_approved BOOLEAN DEFAULT false,
  tests_date DATE,
  tests_technician VARCHAR(150),
  
  technical_responsible_id UUID REFERENCES technical_responsibles(id),
  supervisor_id UUID REFERENCES technical_responsibles(id),
  technical_signature_url TEXT,
  supervisor_signature_url TEXT,
  
  warranties JSONB DEFAULT '[]',
  
  qr_code_url TEXT,
  trace_token VARCHAR(50) UNIQUE,
  
  technical_observations TEXT,
  recommendations TEXT,
  
  final_declaration TEXT,
  declaration_accepted BOOLEAN DEFAULT false,
  declaration_date TIMESTAMPTZ,
  
  issue_date DATE,
  document_version VARCHAR(20) DEFAULT '1.0',
  
  created_by VARCHAR(50),
  finalized_by VARCHAR(50),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eliteshield_project ON eliteshield_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_eliteshield_user ON eliteshield_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_eliteshield_status ON eliteshield_reports(status);
CREATE INDEX IF NOT EXISTS idx_eliteshield_trace ON eliteshield_reports(trace_token);

-- Tabela: Fotos do Laudo
CREATE TABLE IF NOT EXISTS eliteshield_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES eliteshield_reports(id) ON DELETE CASCADE,
  
  stage VARCHAR(50) NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  technician_name VARCHAR(150),
  capture_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eliteshield_photos_report ON eliteshield_photos(report_id);
CREATE INDEX IF NOT EXISTS idx_eliteshield_photos_stage ON eliteshield_photos(stage);

-- Tabela: Etapas de Execução
CREATE TABLE IF NOT EXISTS eliteshield_execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES eliteshield_reports(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(150),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eliteshield_steps_report ON eliteshield_execution_steps(report_id);

-- =====================================================
-- PARTE 4: RLS (Row Level Security)
-- =====================================================

ALTER TABLE eliteshield_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliteshield_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE eliteshield_execution_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios podem ver seus laudos" ON eliteshield_reports;
CREATE POLICY "Usuarios podem ver seus laudos" ON eliteshield_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Executores podem criar laudos" ON eliteshield_reports;
CREATE POLICY "Executores podem criar laudos" ON eliteshield_reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Executores podem atualizar laudos" ON eliteshield_reports;
CREATE POLICY "Executores podem atualizar laudos" ON eliteshield_reports
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Usuarios podem ver fotos do laudo" ON eliteshield_photos;
CREATE POLICY "Usuarios podem ver fotos do laudo" ON eliteshield_photos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Executores podem adicionar fotos" ON eliteshield_photos;
CREATE POLICY "Executores podem adicionar fotos" ON eliteshield_photos
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios podem ver etapas do laudo" ON eliteshield_execution_steps;
CREATE POLICY "Usuarios podem ver etapas do laudo" ON eliteshield_execution_steps
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Executores podem atualizar etapas" ON eliteshield_execution_steps;
CREATE POLICY "Executores podem atualizar etapas" ON eliteshield_execution_steps
  FOR ALL USING (true);

-- =====================================================
-- PARTE 5: TRIGGERS DE ATUALIZAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION update_eliteshield_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_eliteshield_reports_updated_at ON eliteshield_reports;
CREATE TRIGGER update_eliteshield_reports_updated_at
  BEFORE UPDATE ON eliteshield_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_eliteshield_updated_at();

DROP TRIGGER IF EXISTS update_eliteshield_photos_updated_at ON eliteshield_photos;
CREATE TRIGGER update_eliteshield_photos_updated_at
  BEFORE UPDATE ON eliteshield_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_eliteshield_updated_at();

DROP TRIGGER IF EXISTS update_eliteshield_steps_updated_at ON eliteshield_execution_steps;
CREATE TRIGGER update_eliteshield_steps_updated_at
  BEFORE UPDATE ON eliteshield_execution_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_eliteshield_updated_at();

-- =====================================================
-- PARTE 6: FUNÇÃO PARA GERAR TOKEN ELITETRACE™
-- =====================================================

CREATE OR REPLACE FUNCTION generate_trace_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    IF i = 4 OR i = 8 OR i = 12 THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_trace_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trace_token IS NULL THEN
    NEW.trace_token := generate_trace_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_trace_token ON eliteshield_reports;
CREATE TRIGGER auto_trace_token
  BEFORE INSERT ON eliteshield_reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_trace_token();

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
