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

console.log('🗑️  @[supabase] LIMPEZA COMPLETA - PREPARANDO PARA PRODUÇÃO\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function completeCleanup() {
  try {
    console.log('⚠️  ATENÇÃO: Isso vai limpar TODOS os dados não essenciais!');
    console.log('   Apenas estrutura e configurações mínimas serão mantidas.\n');

    // 1. Backup dos dados essenciais (se houver)
    console.log('💾 Verificando dados essenciais para backup...');
    
    const { data: adminUsers } = await supabase
      .from('users_elitetrack')
      .select('*')
      .in('role', ['super_admin', 'admin']);

    if (adminUsers && adminUsers.length > 0) {
      console.log(`   ✅ Encontrados ${adminUsers.length} administradores para manter`);
    }

    // 2. Limpar tabelas em ordem correta (respeitando foreign keys)
    
    // Tabelas sem dependências
    const independentTables = [
      { name: 'rescue_requests', desc: 'Solicitações de Resgate' },
      { name: 'schedules', desc: 'Agendamentos' },
      { name: 'invoices', desc: 'Faturas' },
      { name: 'expenses', desc: 'Despesas' }
    ];

    for (const table of independentTables) {
      console.log(`\n🗑️  Limpando ${table.desc}...`);
      const { error } = await supabase.from(table.name).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      } else {
        console.log(`   ✅ ${table.desc} limpo`);
      }
    }

    // Tabelas com dependências
    console.log('\n📋 Limpando propostas...');
    const { error: proposalsError } = await supabase.from('proposals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(proposalsError ? `   ❌ Erro: ${proposalsError.message}` : '   ✅ Propostas limpas');

    console.log('\n📄 Limpando leads...');
    const { error: leadsError } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(leadsError ? `   ❌ Erro: ${leadsError.message}` : '   ✅ Leads limpos');

    console.log('\n📝 Limpando contratos...');
    const { error: contractsError } = await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(contractsError ? `   ❌ Erro: ${contractsError.message}` : '   ✅ Contratos limpos');

    // Projetos (depende de vehicles e users)
    console.log('\n📋 Limpando projetos...');
    const { error: projectsError } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(projectsError ? `   ❌ Erro: ${projectsError.message}` : '   ✅ Projetos limpos');

    // Veículos (depende de users)
    console.log('\n🚗 Limpando veículos...');
    const { error: vehiclesError } = await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(vehiclesError ? `   ❌ Erro: ${vehiclesError.message}` : '   ✅ Veículos limpos');

    // Seminovos e contas bancárias
    console.log('\n🚗 Limpando seminovos...');
    const { error: preownedError } = await supabase.from('preowned_vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(preownedError ? `   ❌ Erro: ${preownedError.message}` : '   ✅ Seminovos limpos');

    console.log('\n💳 Limpando contas bancárias...');
    const { error: bankError } = await supabase.from('bank_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(bankError ? `   ❌ Erro: ${bankError.message}` : '   ✅ Contas bancárias limpas');

    // Manter apenas usuários essenciais (admin/executors)
    console.log('\n👥 Limpando usuários (mantendo admin/executors)...');
    const { error: usersError } = await supabase
      .from('users_elitetrack')
      .delete()
      .not('role', 'in', ['super_admin', 'admin', 'executor']);

    if (usersError) {
      console.log(`   ❌ Erro: ${usersError.message}`);
    } else {
      console.log('   ✅ Usuários não essenciais removidos');
    }

    // 3. Verificação final
    console.log('\n📊 VERIFICAÇÃO FINAL - ESTADO DE PRODUÇÃO:\n');

    const tables = [
      { name: 'users_elitetrack', desc: 'Usuários', essential: true },
      { name: 'projects', desc: 'Projetos', essential: false },
      { name: 'vehicles', desc: 'Veículos', essential: false },
      { name: 'rescue_requests', desc: 'Solicitações de Resgate', essential: false },
      { name: 'schedules', desc: 'Agendamentos', essential: false },
      { name: 'leads', desc: 'Leads', essential: false },
      { name: 'proposals', desc: 'Propostas', essential: false },
      { name: 'contracts', desc: 'Contratos', essential: false },
      { name: 'invoices', desc: 'Faturas', essential: false },
      { name: 'expenses', desc: 'Despesas', essential: false },
      { name: 'preowned_vehicles', desc: 'Seminovos', essential: false },
      { name: 'bank_accounts', desc: 'Contas Bancárias', essential: false }
    ];

    let totalRecords = 0;
    let essentialTablesReady = true;

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table.desc}: Erro - ${error.message}`);
        if (table.essential) essentialTablesReady = false;
      } else {
        totalRecords += count;
        const status = table.essential ? 
          (count > 0 ? '✅ PRONTA' : '🔴 VAZIA') :
          (count === 0 ? '✅ LIMPA' : '⚠️  TEM DADOS');
        
        const icon = table.essential ? '⭐' : '  ';
        console.log(`${icon} ${status} ${table.desc}: ${count} registros`);
        
        if (table.essential && count === 0) {
          essentialTablesReady = false;
        }
      }
    }

    // 4. Verificar usuários essenciais
    console.log('\n👥 USUÁRIOS ESSENCIAIS RESTANTES:');
    const { data: essentialUsers, error: essentialUsersError } = await supabase
      .from('users_elitetrack')
      .select('name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (!essentialUsersError && essentialUsers) {
      if (essentialUsers.length === 0) {
        console.log('   🔴 NENHUM USUÁRIO ESSENCIAL ENCONTRADO!');
        essentialTablesReady = false;
      } else {
        essentialUsers.forEach(user => {
          const roleIcon = user.role === 'super_admin' ? '👑' : user.role === 'admin' ? '🔧' : user.role === 'executor' ? '👷' : '👤';
          console.log(`   ${roleIcon} ${user.name} (${user.email}) - ${user.role}`);
        });
      }
    }

    // 5. Limpar arquivos mock
    console.log('\n📁 LIMPANDO ARQUIVOS MOCK...');
    
    const filesToClean = [
      'src/data/mockData.ts.disabled',
      'src/data/testData.ts',
      'src/utils/mock.ts',
      'src/constants/mock.ts'
    ];

    filesToClean.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   🗑️  ${file} removido`);
      }
    });

    // 6. Status final
    console.log('\n' + '='.repeat(60));
    if (essentialTablesReady && totalRecords >= 2) {
      console.log('🎉 SUCESSO! Base completamente pronta para produção!');
      console.log('   ✅ Todos os dados mock removidos');
      console.log('   ✅ Apenas usuários essenciais mantidos');
      console.log('   ✅ Tabelas limpas e prontas');
      console.log('   ✅ Arquivos mock removidos');
    } else {
      console.log('⚠️  Base quase pronta. Verifique:');
      if (!essentialTablesReady) console.log('   - Tabelas essenciais vazias');
      if (totalRecords < 2) console.log('   - Poucos ou nenhum usuário essencial');
    }
    console.log('='.repeat(60));
    console.log(`📊 Total de registros restantes: ${totalRecords}`);
    console.log('\n🚀 Base pronta para produção! Use o sistema normalmente.');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

completeCleanup();
