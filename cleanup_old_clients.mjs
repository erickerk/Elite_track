import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧹 LIMPEZA DE CLIENTES ANTIGOS\n');
console.log('='.repeat(60) + '\n');

// Emails de produção que devem ser mantidos
const prodEmails = [
  'juniorrodrigues1011@gmail.com',
  'executor@elite.com',
  'joao@teste.com'
];

async function cleanupOldClients() {
  try {
    // 1. Listar todos os usuários
    console.log('📋 Listando usuários no Supabase...\n');
    
    const { data: users, error } = await supabase
      .from('users_elitetrack')
      .select('id, email, name, role, is_active, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Erro: ' + error.message);
      return;
    }
    
    console.log('Total de usuários: ' + users.length + '\n');
    
    // 2. Identificar clientes antigos (não de produção)
    const oldClients = users.filter(u => 
      !prodEmails.includes(u.email) && 
      u.role === 'client'
    );
    
    console.log('Clientes antigos encontrados: ' + oldClients.length + '\n');
    
    if (oldClients.length === 0) {
      console.log('✅ Nenhum cliente antigo para remover!\n');
      return;
    }
    
    // 3. Listar clientes antigos
    console.log('Clientes que serão removidos:');
    oldClients.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.name})`);
    });
    console.log('');
    
    // 4. Remover clientes antigos
    console.log('🗑️ Removendo clientes antigos...\n');
    
    for (const client of oldClients) {
      // Primeiro remover projetos associados
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', client.id);
      
      if (projectError) {
        console.log(`   ⚠️ Erro ao remover projetos de ${client.email}: ${projectError.message}`);
      }
      
      // Remover documentos do cliente
      const { error: docError } = await supabase
        .from('client_documents')
        .delete()
        .eq('user_id', client.id);
      
      if (docError) {
        console.log(`   ⚠️ Erro ao remover documentos de ${client.email}: ${docError.message}`);
      }
      
      // Remover o usuário
      const { error: userError } = await supabase
        .from('users_elitetrack')
        .delete()
        .eq('id', client.id);
      
      if (userError) {
        console.log(`   ❌ Erro ao remover ${client.email}: ${userError.message}`);
      } else {
        console.log(`   ✅ Removido: ${client.email}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ LIMPEZA CONCLUÍDA!\n');
    
    // 5. Verificar resultado
    const { data: remainingUsers } = await supabase
      .from('users_elitetrack')
      .select('email, name, role')
      .order('role');
    
    console.log('Usuários restantes:');
    remainingUsers?.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    console.log('');
    
  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
  }
}

cleanupOldClients().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
