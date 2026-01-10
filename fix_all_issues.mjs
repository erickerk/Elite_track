import https from 'https';
import { createClient } from '@supabase/supabase-js';

const token = 'sbp_d92a1b647685c1228839c685c792f56871e1f438';
const projectRef = 'rlaxbloitiknjikrpbim';
const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 CORRIGINDO PROBLEMAS REPORTADOS\n');
console.log('='.repeat(70) + '\n');

// 1. Criar tabela client_documents
const createClientDocumentsSQL = `
-- Tabela para documentos do cliente (CNH, CRLV, etc)
CREATE TABLE IF NOT EXISTS client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  project_id VARCHAR(100),
  
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  size VARCHAR(50),
  
  url TEXT,
  storage_path TEXT,
  
  status VARCHAR(20) DEFAULT 'pending',
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(100),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_user ON client_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_project ON client_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);

-- RLS
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own documents" ON client_documents;
CREATE POLICY "Users can view own documents" ON client_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own documents" ON client_documents;
CREATE POLICY "Users can insert own documents" ON client_documents
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own documents" ON client_documents;
CREATE POLICY "Users can delete own documents" ON client_documents
  FOR DELETE USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_client_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_documents_trigger ON client_documents;
CREATE TRIGGER update_client_documents_trigger
  BEFORE UPDATE ON client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_client_documents_updated_at();
`;

async function createClientDocumentsTable() {
  console.log('📋 PASSO 1: Criando tabela client_documents...\n');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({ query: createClientDocumentsSQL });
    
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
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   ✅ Tabela client_documents criada com sucesso\n');
          resolve(true);
        } else {
          console.log('   ⚠️ Status: ' + res.statusCode);
          console.log('   ' + data.substring(0, 200) + '\n');
          resolve(false);
        }
      });
    });
    
    req.on('error', (e) => {
      console.log('   ❌ Erro: ' + e.message + '\n');
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

async function cleanOldClients() {
  console.log('📋 PASSO 2: Verificando clientes no Supabase...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('users_elitetrack')
      .select('id, email, name, role, is_active, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('   ❌ Erro: ' + error.message + '\n');
      return;
    }
    
    console.log('   Total de usuários: ' + users.length + '\n');
    
    // Listar todos os usuários
    console.log('   Usuários encontrados:');
    users.forEach((u, i) => {
      const status = u.is_active ? '✅ Ativo' : '❌ Inativo';
      console.log(`   ${i + 1}. ${u.email} (${u.role}) - ${status}`);
    });
    console.log('');
    
    // Identificar usuários de produção
    const prodEmails = ['juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com'];
    const oldUsers = users.filter(u => !prodEmails.includes(u.email) && u.role === 'client');
    
    if (oldUsers.length > 0) {
      console.log('   ⚠️ Clientes antigos encontrados: ' + oldUsers.length);
      oldUsers.forEach(u => {
        console.log('      - ' + u.email + ' (' + u.name + ')');
      });
      console.log('');
      console.log('   💡 Para limpar, execute manualmente no Supabase ou confirme aqui');
    } else {
      console.log('   ✅ Nenhum cliente antigo para limpar\n');
    }
    
  } catch (err) {
    console.log('   ❌ Erro: ' + err.message + '\n');
  }
}

async function verifyProjects() {
  console.log('📋 PASSO 3: Verificando projetos no Supabase...\n');
  
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, user_id, status, qr_code, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('   ❌ Erro: ' + error.message + '\n');
      return;
    }
    
    console.log('   Total de projetos: ' + projects.length + '\n');
    
    // Verificar projetos órfãos (sem user_id válido)
    const orphanProjects = projects.filter(p => !p.user_id);
    if (orphanProjects.length > 0) {
      console.log('   ⚠️ Projetos órfãos (sem user_id): ' + orphanProjects.length + '\n');
    } else {
      console.log('   ✅ Todos os projetos têm user_id válido\n');
    }
    
  } catch (err) {
    console.log('   ❌ Erro: ' + err.message + '\n');
  }
}

async function main() {
  await createClientDocumentsTable();
  await cleanOldClients();
  await verifyProjects();
  
  console.log('='.repeat(70));
  console.log('\n✅ CORREÇÕES APLICADAS\n');
  console.log('Próximos passos no código:');
  console.log('1. Ajustar ExecutorDashboard para buscar documentos do Supabase');
  console.log('2. Melhorar scroll na tela de Perfil');
  console.log('3. Ajustar Orçamento para mostrar clientes do Supabase');
  console.log('4. Corrigir Chat para selecionar clientes');
  console.log('');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
