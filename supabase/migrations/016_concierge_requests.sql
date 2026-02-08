-- =====================================================
-- ELITE TRACK - MIGRAÇÃO 016
-- Tabela: concierge_requests (Elite Concierge Veicular)
-- Data: 2026-02-08
-- =====================================================

-- Elite Concierge Veicular - Serviços de concierge para clientes
-- Permite que clientes solicitem serviços especiais:
-- - Revisão programada
-- - Manutenção corretiva
-- - Serviço retira/leva
-- - Verificação técnica
-- - Outros serviços personalizados

CREATE TABLE IF NOT EXISTS concierge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Tipo de serviço solicitado
  service_type TEXT NOT NULL CHECK (service_type IN (
    'revisao_programada',      -- Revisão periódica agendada
    'manutencao_corretiva',    -- Reparo ou correção de problema
    'retira_leva',             -- Serviço de buscar/entregar veículo
    'verificacao_tecnica',     -- Inspeção técnica do veículo
    'lavagem_detailing',       -- Limpeza e detalhamento
    'outro'                    -- Outros serviços
  )),
  
  -- Detalhes da solicitação
  description TEXT,                    -- Descrição detalhada do serviço
  location TEXT,                       -- Localização (ex: "São Paulo - Zona Sul")
  preferred_date TIMESTAMPTZ,          -- Data preferida para o serviço
  
  -- Status do pedido
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Aguardando análise
    'approved',     -- Aprovado pela equipe
    'scheduled',    -- Agendado
    'in_progress',  -- Em execução
    'completed',    -- Concluído
    'cancelled'     -- Cancelado
  )),
  
  -- Datas de execução
  scheduled_date TIMESTAMPTZ,          -- Data agendada após aprovação
  completed_date TIMESTAMPTZ,          -- Data de conclusão do serviço
  
  -- Gestão interna
  assigned_to UUID REFERENCES users(id), -- Operador responsável
  notes TEXT,                            -- Notas internas da equipe
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Contato
  contact_phone TEXT,                   -- Telefone de contato (opcional)
  contact_email TEXT,                   -- Email de contato (opcional)
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_concierge_user_id 
  ON concierge_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_concierge_project_id 
  ON concierge_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_concierge_status 
  ON concierge_requests(status);

CREATE INDEX IF NOT EXISTS idx_concierge_service_type 
  ON concierge_requests(service_type);

CREATE INDEX IF NOT EXISTS idx_concierge_created_at 
  ON concierge_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_scheduled_date 
  ON concierge_requests(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_concierge_assigned_to 
  ON concierge_requests(assigned_to);

-- =====================================================
-- RLS (Row Level Security) - Segurança
-- =====================================================

ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;

-- Cliente vê apenas suas próprias solicitações
DROP POLICY IF EXISTS "Clientes veem suas solicitações" ON concierge_requests;
CREATE POLICY "Clientes veem suas solicitações"
  ON concierge_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'client'
      AND concierge_requests.user_id = auth.uid()
    )
  );

-- Cliente pode criar suas próprias solicitações
DROP POLICY IF EXISTS "Clientes criam solicitações" ON concierge_requests;
CREATE POLICY "Clientes criam solicitações"
  ON concierge_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'client'
      AND concierge_requests.user_id = auth.uid()
    )
  );

-- Cliente pode atualizar apenas suas solicitações pendentes
DROP POLICY IF EXISTS "Clientes atualizam suas solicitações pendentes" ON concierge_requests;
CREATE POLICY "Clientes atualizam suas solicitações pendentes"
  ON concierge_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'client'
      AND concierge_requests.user_id = auth.uid()
      AND concierge_requests.status = 'pending'
    )
  );

-- Admin e Executor têm acesso total
DROP POLICY IF EXISTS "Admin e Executor acesso total" ON concierge_requests;
CREATE POLICY "Admin e Executor acesso total"
  ON concierge_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executor')
    )
  );

-- =====================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_concierge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS concierge_updated_at ON concierge_requests;
CREATE TRIGGER concierge_updated_at
  BEFORE UPDATE ON concierge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_concierge_updated_at();

-- =====================================================
-- REALTIME: Habilitar notificações em tempo real
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE concierge_requests;

-- =====================================================
-- GRANTS: Permissões (desenvolvimento)
-- =====================================================

GRANT ALL ON concierge_requests TO anon, authenticated;

-- =====================================================
-- COMENTÁRIOS: Documentação da tabela
-- =====================================================

COMMENT ON TABLE concierge_requests IS 'Solicitações de serviços Elite Concierge Veicular';
COMMENT ON COLUMN concierge_requests.service_type IS 'Tipo de serviço: revisao_programada, manutencao_corretiva, retira_leva, verificacao_tecnica, lavagem_detailing, outro';
COMMENT ON COLUMN concierge_requests.status IS 'Status: pending, approved, scheduled, in_progress, completed, cancelled';
COMMENT ON COLUMN concierge_requests.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN concierge_requests.assigned_to IS 'ID do operador responsável pelo atendimento';

-- =====================================================
-- DADOS DE TESTE (opcional - remover em produção)
-- =====================================================

-- Exemplo de inserção (descomentar apenas para teste)
-- INSERT INTO concierge_requests (
--   user_id,
--   service_type,
--   description,
--   location,
--   status,
--   priority
-- ) VALUES (
--   (SELECT id FROM users WHERE role = 'client' LIMIT 1),
--   'revisao_programada',
--   'Solicitação de revisão periódica - 10.000 km',
--   'São Paulo - Zona Sul',
--   'pending',
--   'medium'
-- );

-- =====================================================
-- VALIDAÇÃO: Verificar criação da tabela
-- =====================================================

-- Execute para validar:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'concierge_requests';

-- =====================================================
-- FIM DA MIGRAÇÃO 016
-- =====================================================

-- Para executar esta migration:
-- 1. Acesse o dashboard do Supabase
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Run)
-- 5. Verifique se não há erros
-- 6. Teste inserindo um registro manualmente
