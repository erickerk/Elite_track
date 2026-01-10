-- Migration: Create rescue_requests and schedules tables
-- Execute this in Supabase SQL Editor

-- =====================================================
-- TABELA: rescue_requests (Solicitações Elite Rescue)
-- =====================================================
CREATE TABLE IF NOT EXISTS rescue_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  vehicle TEXT NOT NULL,
  vehicle_plate TEXT,
  rescue_type TEXT NOT NULL CHECK (rescue_type IN ('mechanical', 'accident', 'flat', 'battery', 'locked', 'other')),
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'high' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to TEXT,
  dispatcher_notes TEXT,
  eta_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rescue_requests
CREATE INDEX IF NOT EXISTS idx_rescue_status ON rescue_requests(status);
CREATE INDEX IF NOT EXISTS idx_rescue_priority ON rescue_requests(priority);
CREATE INDEX IF NOT EXISTS idx_rescue_created ON rescue_requests(created_at);

-- RLS para rescue_requests
ALTER TABLE rescue_requests ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção
CREATE POLICY "Anyone can create rescue requests"
  ON rescue_requests FOR INSERT
  WITH CHECK (true);

-- Política para permitir leitura
CREATE POLICY "Anyone can view rescue requests"
  ON rescue_requests FOR SELECT
  USING (true);

-- Política para permitir atualização
CREATE POLICY "Anyone can update rescue requests"
  ON rescue_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABELA: schedules (Agendamentos de Revisões)
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  vehicle TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revisao', 'entrega', 'manutencao', 'outro')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para schedules
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_project ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- RLS para schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações
CREATE POLICY "Anyone can manage schedules"
  ON schedules FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para rescue_requests
DROP TRIGGER IF EXISTS rescue_requests_updated_at ON rescue_requests;
CREATE TRIGGER rescue_requests_updated_at
  BEFORE UPDATE ON rescue_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para schedules
DROP TRIGGER IF EXISTS schedules_updated_at ON schedules;
CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- SELECT 'rescue_requests' as table_name, count(*) as rows FROM rescue_requests
-- UNION ALL
-- SELECT 'schedules' as table_name, count(*) as rows FROM schedules;
