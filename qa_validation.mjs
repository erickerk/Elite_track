import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 VALIDAÇÃO QA - Elite Track Production\n');
console.log('='.repeat(70));

async function testUsers() {
  console.log('\n📋 TESTE 1: Validação de Usuários\n');
  
  try {
    const { data, error } = await supabase
      .from('users_elitetrack')
      .select('*')
      .in('email', ['juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com']);
    
    if (error) {
      console.log('❌ FALHA: ' + error.message);
      return false;
    }
    
    if (!data || data.length !== 3) {
      console.log('❌ FALHA: Esperado 3 usuários, encontrado ' + (data?.length || 0));
      return false;
    }
    
    console.log('✅ SUCESSO: 3 usuários encontrados\n');
    
    const expectedUsers = {
      'juniorrodrigues1011@gmail.com': { role: 'super_admin', vip_level: 'platinum' },
      'executor@elite.com': { role: 'executor' },
      'joao@teste.com': { role: 'client' }
    };
    
    let allValid = true;
    
    for (const user of data) {
      const expected = expectedUsers[user.email];
      console.log(`   Usuário: ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nome: ${user.name}`);
      console.log(`   - Role: ${user.role} ${user.role === expected.role ? '✅' : '❌'}`);
      console.log(`   - Senha hash: ${user.password_hash ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   - Ativo: ${user.is_active ? '✅ Sim' : '❌ Não'}`);
      
      if (expected.vip_level) {
        console.log(`   - VIP Level: ${user.vip_level} ${user.vip_level === expected.vip_level ? '✅' : '❌'}`);
      }
      
      console.log('');
      
      if (user.role !== expected.role || !user.password_hash || !user.is_active) {
        allValid = false;
      }
    }
    
    return allValid;
  } catch (err) {
    console.log('❌ ERRO: ' + err.message);
    return false;
  }
}

async function testProjects() {
  console.log('\n📋 TESTE 2: Validação de Projetos (QR Codes)\n');
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, qr_code, user_id, status')
      .limit(10);
    
    if (error) {
      console.log('❌ FALHA: ' + error.message);
      return false;
    }
    
    console.log(`✅ SUCESSO: ${data?.length || 0} projetos encontrados\n`);
    
    if (data && data.length > 0) {
      const qrCodes = new Set();
      let allUnique = true;
      
      for (const project of data) {
        if (qrCodes.has(project.qr_code)) {
          console.log(`❌ QR Code duplicado: ${project.qr_code}`);
          allUnique = false;
        } else {
          qrCodes.add(project.qr_code);
          console.log(`   Projeto: ${project.id}`);
          console.log(`   - QR Code: ${project.qr_code} ✅`);
          console.log(`   - Status: ${project.status}`);
          console.log('');
        }
      }
      
      return allUnique;
    }
    
    console.log('⚠️ Nenhum projeto encontrado (esperado para ambiente novo)');
    return true;
  } catch (err) {
    console.log('❌ ERRO: ' + err.message);
    return false;
  }
}

async function testTables() {
  console.log('\n📋 TESTE 3: Validação de Tabelas Compartilhadas\n');
  
  const tables = [
    'users_elitetrack',
    'projects',
    'vehicles',
    'chat_conversations',
    'chat_messages',
    'notifications',
    'quotes'
  ];
  
  let allValid = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        allValid = false;
      } else {
        console.log(`   ✅ ${table}: Acessível`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

async function testEliteShieldTables() {
  console.log('\n📋 TESTE 4: Validação de Tabelas do Laudo EliteShield™\n');
  
  const tables = [
    'blinding_lines',
    'glass_specs',
    'opaque_materials',
    'warranty_types',
    'technical_responsibles',
    'eliteshield_reports',
    'eliteshield_photos',
    'eliteshield_execution_steps'
  ];
  
  let allValid = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ⚠️ ${table}: ${error.message}`);
        console.log(`      (Migração SQL 004 ainda não aplicada)`);
        allValid = false;
      } else {
        console.log(`   ✅ ${table}: Acessível`);
      }
    } catch (err) {
      console.log(`   ⚠️ ${table}: ${err.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

async function runAllTests() {
  const results = {
    users: await testUsers(),
    projects: await testProjects(),
    tables: await testTables(),
    eliteshield: await testEliteShieldTables()
  };
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMO DA VALIDAÇÃO QA\n');
  console.log(`   Usuários de Produção: ${results.users ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`   Projetos e QR Codes: ${results.projects ? '✅ PASSOU' : '⚠️ PENDENTE'}`);
  console.log(`   Tabelas Compartilhadas: ${results.tables ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`   Tabelas EliteShield™: ${results.eliteshield ? '✅ PASSOU' : '⚠️ MIGRAÇÃO PENDENTE'}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 AÇÕES NECESSÁRIAS:\n');
  
  if (!results.users) {
    console.log('   ❌ Corrigir usuários de produção');
  }
  
  if (!results.eliteshield) {
    console.log('   ⚠️ Aplicar migração SQL 004_production_users_eliteshield.sql');
    console.log('      no SQL Editor do Supabase Dashboard');
  }
  
  if (results.users && results.tables) {
    console.log('   ✅ Aplicação pronta para uso com dados existentes');
    console.log('   ⚠️ Migração do Laudo EliteShield™ pendente (executar SQL manualmente)');
  }
  
  console.log('\n' + '='.repeat(70));
}

runAllTests().catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});
