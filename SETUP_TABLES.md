# 🚀 Criar Tabelas no Supabase

## ⚠️ IMPORTANTE: Execute o SQL abaixo no Supabase Dashboard

### Passo 1: Acesse o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard
2. Selecione o projeto: **rlaxbloitiknjikrpbim**
3. Clique em **SQL Editor** (menu esquerdo)
4. Clique em **New Query**

### Passo 2: Cole o SQL abaixo

```sql
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
  rescue_type TEXT NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'high',
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

CREATE POLICY IF NOT EXISTS "Anyone can create rescue requests"
  ON rescue_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can view rescue requests"
  ON rescue_requests FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can update rescue requests"
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
  type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'pending',
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

CREATE POLICY IF NOT EXISTS "Anyone can manage schedules"
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

DROP TRIGGER IF EXISTS rescue_requests_updated_at ON rescue_requests;
CREATE TRIGGER rescue_requests_updated_at
  BEFORE UPDATE ON rescue_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS schedules_updated_at ON schedules;
CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Passo 3: Execute
1. Clique no botão **Run** (ou Ctrl+Enter)
2. Aguarde a conclusão

### Passo 4: Verifique
Execute este comando para verificar se as tabelas foram criadas:

```sql
SELECT 'rescue_requests' as table_name, count(*) as rows FROM rescue_requests
UNION ALL
SELECT 'schedules' as table_name, count(*) as rows FROM schedules;
```

---

## ✅ Verificação Final

Após executar, você deve ver:
- ✅ `rescue_requests` - 0 rows
- ✅ `schedules` - 0 rows

Se ambas aparecerem, as tabelas foram criadas com sucesso!

---

## 📝 Notas

- O arquivo SQL completo está em: `supabase/migrations/008_rescue_and_schedules.sql`
- Todas as tabelas têm RLS (Row Level Security) habilitado
- Triggers automáticos atualizam `updated_at` em cada modificação
- Índices foram criados para melhor performance
