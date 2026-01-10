const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rlaxbloitiknjikrpbim.supabase.co',
  'sbp_d92a1b647685c1228839c685c792f56871e1f438'
);

async function migrate() {
  console.log('🚀 Iniciando migração de usuários...\n');
  
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
      const { data, error } = await supabase
        .from('users_elitetrack')
        .upsert([user], { onConflict: 'email' });
      
      if (error) {
        console.log('❌ ' + user.email + ': ' + error.message);
        failed++;
      } else {
        console.log('✅ ' + user.email + ' (' + user.role + ')');
        success++;
      }
    } catch (err) {
      console.log('❌ ' + user.email + ': ' + err.message);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Resultado: ' + success + ' sucesso, ' + failed + ' falhas');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Verificando usuários criados...\n');
  const { data, error } = await supabase
    .from('users_elitetrack')
    .select('id, name, email, role, is_active')
    .in('email', ['juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com']);
  
  if (error) {
    console.log('❌ Erro: ' + error.message);
  } else if (data && data.length > 0) {
    console.log('✅ Usuários encontrados:');
    data.forEach(u => {
      console.log('   • ' + u.email + ' (' + u.role + ') - ' + (u.is_active ? 'Ativo' : 'Inativo'));
    });
  } else {
    console.log('⚠️ Nenhum usuário encontrado');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

migrate().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
