-- =====================================================
-- ELITE TRACK - MIGRAÇÃO 013
-- Correção/Criação das tabelas: quotes e schedules
-- Execute este script no SQL Editor do dashboard do Supabase
-- =====================================================

-- =====================================================
-- TABELA: quotes (Orçamentos de clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
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
  estimated_price DECIMAL(12,2),
  estimated_days INTEGER,
  days_type VARCHAR(20) DEFAULT 'business',
  executor_notes TEXT,
  executor_id UUID,
  executor_name VARCHAR(255),
  client_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para quotes
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- =====================================================
-- TABELA: schedules (Agendamentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  client_id UUID,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  vehicle VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'revisao',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para schedules
CREATE INDEX IF NOT EXISTS idx_schedules_client_id ON schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(type);

-- =====================================================
-- RLS (Row Level Security) - Políticas de segurança
-- =====================================================

-- Desabilitar RLS temporariamente para permitir acesso público
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;

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

-- Triggers para updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT: Permissões públicas (para desenvolvimento)
-- =====================================================
GRANT ALL ON quotes TO anon, authenticated;
GRANT ALL ON schedules TO anon, authenticated;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
