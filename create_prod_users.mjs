import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createProductionUsers() {
  console.log('🚀 Criando usuários de produção no Supabase...\n');
  console.log('URL: ' + SUPABASE_URL);
  console.log('');

  const users = [
    {
      id: 'admin-master-001',
      name: 'Junior Rodrigues',
      email: 'juniorrodrigues1011@gmail.com',
      phone: '(11) 99999-9999',
      role: 'super_admin',
      password_hash: 'Elite@2024#Admin!',
      vip_level: 'platinum',
      is_active: true
    },
    {
      id: 'executor-prod-001',
      name: 'Executor Elite',
      email: 'executor@elite.com',
      phone: '(11) 98888-8888',
      role: 'executor',
      password_hash: 'executor123',
      is_active: true
    },
    {
      id: 'client-joao-001',
      name: 'João Teste',
      email: 'joao@teste.com',
      phone: '(11) 97777-7777',
      role: 'client',
      password_hash: 'Teste@2025',
      is_active: true
    }
  ];

  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      console.log('[*] Criando: ' + user.email);
      
      const { data, error } = await supabase
        .from('users_elitetrack')
        .upsert([user], { onConflict: 'email' });
      
      if (error) {
        console.log('❌ Erro: ' + error.message);
        failed++;
      } else {
        console.log('✅ Sucesso (' + user.role + ')\n');
        success++;
      }
    } catch (err) {
      console.log('❌ Erro: ' + err.message + '\n');
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log('📊 Resultado: ' + success + ' sucesso, ' + failed + ' falhas');
  console.log('='.repeat(60));

  // Verificar usuários criados
  console.log('\n🔍 Verificando usuários criados...\n');
  try {
    const { data, error } = await supabase
      .from('users_elitetrack')
      .select('id, name, email, role, is_active')
      .in('email', ['juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com']);

    if (error) {
      console.log('❌ Erro ao verificar: ' + error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Usuários encontrados:');
      data.forEach(u => {
        const status = u.is_active ? '✅ Ativo' : '❌ Inativo';
        console.log('   • ' + u.email + ' (' + u.role + ') - ' + status);
      });
    } else {
      console.log('⚠️ Nenhum usuário encontrado');
    }
  } catch (err) {
    console.log('❌ Erro: ' + err.message);
  }

  process.exit(failed === 0 ? 0 : 1);
}

createProductionUsers().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
