#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler configuração do .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const ANON_KEY = anonKeyMatch ? anonKeyMatch[1].trim() : '';

console.log('🗑️  @[supabase] Deletando clientes da base...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function deleteClients() {
  try {
    // 1. Listar todos os usuários
    console.log('📋 Listando todos os usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users_elitetrack')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários:\n`);
    
    // Separar por tipo
    const admins = users.filter(u => u.role === 'super_admin' || u.role === 'admin');
    const executors = users.filter(u => u.role === 'executor');
    const clients = users.filter(u => u.role === 'client' || u.role === 'customer');
    
    console.log('👑 Administradores:');
    admins.forEach(u => {
      console.log(`   ✅ ${u.name} (${u.email}) - ${u.role}`);
    });
    
    console.log('\n🔧 Executores:');
    executors.forEach(u => {
      console.log(`   ✅ ${u.name} (${u.email}) - ${u.role}`);
    });
    
    console.log('\n👥 Clientes a serem deletados:');
    clients.forEach(u => {
      console.log(`   ❌ ${u.name} (${u.email}) - ${u.role}`);
    });
    
    if (clients.length === 0) {
      console.log('\n✅ Nenhum cliente encontrado para deletar!');
      return;
    }
    
    // 2. Confirmar operação
    console.log(`\n⚠️  ATENÇÃO: Serão deletados ${clients.length} clientes e todos os dados relacionados!`);
    console.log('   Isso inclui projetos, veículos e outros dados vinculados.\n');
    
    // 3. Deletar projetos dos clientes
    console.log('🗑️  Deletando projetos dos clientes...');
    for (const client of clients) {
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', client.id);
      
      if (projectError) {
        console.log(`   ⚠️  Erro ao deletar projetos de ${client.name}: ${projectError.message}`);
      } else {
        console.log(`   ✅ Projetos de ${client.name} deletados`);
      }
    }
    
    // 4. Deletar veículos dos clientes
    console.log('\n🗑️  Deletando veículos dos clientes...');
    for (const client of clients) {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .delete()
        .eq('user_id', client.id);
      
      if (vehicleError) {
        console.log(`   ⚠️  Erro ao deletar veículos de ${client.name}: ${vehicleError.message}`);
      } else {
        console.log(`   ✅ Veículos de ${client.name} deletados`);
      }
    }
    
    // 5. Deletar os clientes
    console.log('\n🗑️  Deletando clientes...');
    for (const client of clients) {
      const { error: deleteError } = await supabase
        .from('users_elitetrack')
        .delete()
        .eq('id', client.id);
      
      if (deleteError) {
        console.log(`   ❌ Erro ao deletar ${client.name}: ${deleteError.message}`);
      } else {
        console.log(`   ✅ ${client.name} deletado`);
      }
    }
    
    // 6. Verificar resultado
    console.log('\n📊 Verificando resultado final...');
    const { data: remainingUsers, error: remainingError } = await supabase
      .from('users_elitetrack')
      .select('*');
    
    if (!remainingError) {
      console.log(`\n✅ Operação concluída!`);
      console.log(`📊 Usuários restantes: ${remainingUsers.length}`);
      console.log('\n👥 Usuários mantidos:');
      remainingUsers.forEach(u => {
        console.log(`   ✅ ${u.name} (${u.email}) - ${u.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

deleteClients();
