import fetch from 'node-fetch';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
// Chave anônima padrão do Supabase (pode ser obtida no dashboard)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.PLACEHOLDER';

async function setupUsers() {
  console.log('🚀 Configurando usuários de produção...\n');
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
      
      const response = await fetch(
        SUPABASE_URL + '/rest/v1/users_elitetrack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(user)
        }
      );

      if (response.ok) {
        console.log('✅ Sucesso\n');
        success++;
      } else {
        const error = await response.text();
        console.log('⚠️ Status: ' + response.status);
        console.log('   Erro: ' + error.substring(0, 100) + '\n');
        failed++;
      }
    } catch (err) {
      console.log('❌ Erro: ' + err.message + '\n');
      failed++;
    }
  }

  console.log('='.repeat(60));
  console.log('Resultado: ' + success + ' sucesso, ' + failed + ' falhas');
  console.log('='.repeat(60));
}

setupUsers().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
