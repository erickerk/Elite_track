import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para gerar UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function verifyAndFixUsers() {
  console.log('🚀 Verificando e corrigindo usuários de produção...\n');

  const users = [
    {
      id: generateUUID(),
      name: 'Junior Rodrigues',
      email: 'juniorrodrigues1011@gmail.com',
      phone: '(11) 99999-9999',
      role: 'super_admin',
      password_hash: 'Elite@2024#Admin!',
      vip_level: 'platinum',
      is_active: true
    },
    {
      id: generateUUID(),
      name: 'Executor Elite',
      email: 'executor@elite.com',
      phone: '(11) 98888-8888',
      role: 'executor',
      password_hash: 'executor123',
      is_active: true
    },
    {
      id: generateUUID(),
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
      console.log('[*] Atualizando: ' + user.email);
      
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

  // Verificar usuários finais
  console.log('\n✅ USUÁRIOS DE PRODUÇÃO CRIADOS:\n');
  try {
    const { data, error } = await supabase
      .from('users_elitetrack')
      .select('id, name, email, role, is_active')
      .in('email', ['juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com'])
      .order('role');

    if (error) {
      console.log('❌ Erro ao verificar: ' + error.message);
    } else if (data && data.length > 0) {
      console.log('Usuários encontrados: ' + data.length + '\n');
      data.forEach((u, i) => {
        const roleEmoji = u.role === 'super_admin' ? '👑' : u.role === 'executor' ? '🔧' : '👤';
        const status = u.is_active ? '✅ Ativo' : '❌ Inativo';
        console.log((i + 1) + '. ' + roleEmoji + ' ' + u.email);
        console.log('   Role: ' + u.role);
        console.log('   Status: ' + status);
        console.log('   ID: ' + u.id);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhum usuário encontrado');
    }
  } catch (err) {
    console.log('❌ Erro: ' + err.message);
  }

  console.log('='.repeat(60));
  console.log('\n📋 CREDENCIAIS DE ACESSO:\n');
  console.log('Admin Master:');
  console.log('  Email: juniorrodrigues1011@gmail.com');
  console.log('  Senha: Elite@2024#Admin!');
  console.log('  URL: https://elite-track.vercel.app/\n');
  console.log('Executor:');
  console.log('  Email: executor@elite.com');
  console.log('  Senha: executor123\n');
  console.log('Cliente Teste:');
  console.log('  Email: joao@teste.com');
  console.log('  Senha: Teste@2025\n');
  console.log('='.repeat(60));

  process.exit(failed === 0 ? 0 : 1);
}

verifyAndFixUsers().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
