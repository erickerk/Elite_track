-- =====================================================
-- TABELA DE AGENDAMENTOS (SCHEDULES)
-- =====================================================

CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES users_elitetrack(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revisao', 'entrega', 'vistoria')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users_elitetrack(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_schedules_client_id ON schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(type);

-- RLS Policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Admin e executores podem ver todos os agendamentos
CREATE POLICY "Admin e executores podem ver agendamentos"
  ON schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_elitetrack
      WHERE id = auth.uid()
      AND role IN ('admin', 'executor')
    )
  );

-- Admin e executores podem criar agendamentos
CREATE POLICY "Admin e executores podem criar agendamentos"
  ON schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_elitetrack
      WHERE id = auth.uid()
      AND role IN ('admin', 'executor')
    )
  );

-- Admin e executores podem atualizar agendamentos
CREATE POLICY "Admin e executores podem atualizar agendamentos"
  ON schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_elitetrack
      WHERE id = auth.uid()
      AND role IN ('admin', 'executor')
    )
  );

-- Admin pode deletar agendamentos
CREATE POLICY "Admin pode deletar agendamentos"
  ON schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users_elitetrack
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
