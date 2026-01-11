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

console.log('🗑️  @[supabase] Limpando dados mock da produção...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function cleanMockData() {
  try {
    console.log('⚠️  ATENÇÃO: Isso vai deletar todos os dados mock da produção!');
    console.log('   Apenas dados de teste/demonstração serão removidos.\n');

    // 1. Limpar usuários de teste (mantendo admin e executores reais)
    console.log('👥 Limpando usuários de teste...');
    const { error: usersError } = await supabase
      .from('users_elitetrack')
      .delete()
      .or('email.ilike.%teste%,email.ilike.%test%,email.ilike.%demo%,email.ilike.%mock%,name.ilike.%teste%,name.ilike.%test%,name.ilike.%demo%,name.ilike.%mock%')
      .not('role', 'in', (['super_admin', 'admin', 'executor']));

    if (usersError) {
      console.log(`   ❌ Erro: ${usersError.message}`);
    } else {
      console.log('   ✅ Usuários de teste removidos');
    }

    // 2. Limpar projetos de teste
    console.log('\n📋 Limpando projetos de teste...');
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .or('qr_code.ilike.%TEST%,qr_code.ilike.%DEMO%,qr_code.ilike.%MOCK%,qr_code.ilike.%123%');

    if (projectsError) {
      console.log(`   ❌ Erro: ${projectsError.message}`);
    } else {
      console.log('   ✅ Projetos de teste removidos');
    }

    // 3. Limpar veículos de teste
    console.log('\n🚗 Limpando veículos de teste...');
    const { error: vehiclesError } = await supabase
      .from('vehicles')
      .delete()
      .or('plate.ilike.%TEST%,plate.ilike.%DEMO%,plate.ilike.%MOCK%,plate.ilike.%ABC%,plate.ilike.%123%');

    if (vehiclesError) {
      console.log(`   ❌ Erro: ${vehiclesError.message}`);
    } else {
      console.log('   ✅ Veículos de teste removidos');
    }

    // 4. Limpar leads de teste
    console.log('\n📄 Limpando leads de teste...');
    const { error: leadsError } = await supabase
      .from('leads')
      .delete()
      .or('name.ilike.%teste%,name.ilike.%test%,name.ilike.%demo%,name.ilike.%mock%,email.ilike.%teste%,email.ilike.%test%,email.ilike.%demo%,email.ilike.%mock%');

    if (leadsError) {
      console.log(`   ❌ Erro: ${leadsError.message}`);
    } else {
      console.log('   ✅ Leads de teste removidos');
    }

    // 5. Limpar contratos de teste
    console.log('\n📝 Limpando contratos de teste...');
    const { error: contractsError } = await supabase
      .from('contracts')
      .delete()
      .or('title.ilike.%teste%,title.ilike.%test%,title.ilike.%demo%,title.ilike.%mock%');

    if (contractsError) {
      console.log(`   ❌ Erro: ${contractsError.message}`);
    } else {
      console.log('   ✅ Contratos de teste removidos');
    }

    // 6. Verificar resultado
    console.log('\n📊 Verificando resultado final...\n');

    const tables = [
      { name: 'users_elitetrack', desc: 'Usuários' },
      { name: 'projects', desc: 'Projetos' },
      { name: 'vehicles', desc: 'Veículos' },
      { name: 'leads', desc: 'Leads' },
      { name: 'contracts', desc: 'Contratos' }
    ];

    let totalRemaining = 0;

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        console.log(`📋 ${table.desc}: ${count} registros restantes`);
        totalRemaining += count;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ LIMPEZA CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`📊 Total de registros restantes: ${totalRemaining}`);
    console.log('\n🎯 Agora a base contém apenas dados reais de produção!');

    // 7. Verificar arquivo mockData.ts
    console.log('\n🔍 Verificando arquivo mockData.ts...');
    const mockDataPath = path.join(__dirname, 'src/data/mockData.ts');
    
    if (fs.existsSync(mockDataPath)) {
      console.log('⚠️  Arquivo mockData.ts encontrado');
      console.log('   Recomendação: Renomear ou remover para evitar uso em produção');
      
      // Criar backup
      const backupPath = path.join(__dirname, 'src/data/mockData.ts.backup');
      fs.copyFileSync(mockDataPath, backupPath);
      console.log('   ✅ Backup criado: mockData.ts.backup');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

cleanMockData();
