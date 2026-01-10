import https from 'https';

const token = 'sbp_d92a1b647685c1228839c685c792f56871e1f438';
const projectRef = 'rlaxbloitiknjikrpbim';

const sqlContent = `
-- Criar tabela quotes (orçamentos)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(50),
  user_id VARCHAR(50),
  vehicle_id UUID,
  
  quote_number VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'draft',
  
  blinding_level VARCHAR(50),
  total_price DECIMAL(10, 2),
  discount DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2),
  
  items JSONB DEFAULT '[]',
  
  valid_until DATE,
  notes TEXT,
  
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_project ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quotes_updated_at_trigger ON quotes;
CREATE TRIGGER update_quotes_updated_at_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios podem ver seus orcamentos" ON quotes;
CREATE POLICY "Usuarios podem ver seus orcamentos" ON quotes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Executores podem criar orcamentos" ON quotes;
CREATE POLICY "Executores podem criar orcamentos" ON quotes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Executores podem atualizar orcamentos" ON quotes;
CREATE POLICY "Executores podem atualizar orcamentos" ON quotes
  FOR UPDATE USING (true);
`;

console.log('🚀 Criando tabela quotes no Supabase...\n');

const postData = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/' + projectRef + '/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Status HTTP: ' + res.statusCode + '\n');
  
  res.on('data', chunk => data += chunk);
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ TABELA QUOTES CRIADA COM SUCESSO!\n');
      console.log('Tabela: quotes');
      console.log('Índices: project_id, user_id, status');
      console.log('Triggers: updated_at automático');
      console.log('RLS: Habilitado com políticas de acesso');
    } else {
      console.log('❌ ERRO ao criar tabela');
      console.log('Status: ' + res.statusCode);
      console.log('Resposta:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro de conexão:', e.message);
});

req.write(postData);
req.end();
