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

console.log('🔍 @[supabase] Verificando dados em produção...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkProductionData() {
  const tables = [
    { name: 'users_elitetrack', desc: 'Usuários', checkMock: ['mock', 'test', 'fake', 'demo'] },
    { name: 'projects', desc: 'Projetos', checkMock: ['TEST', 'DEMO', 'MOCK', '123'] },
    { name: 'vehicles', desc: 'Veículos', checkMock: ['TEST', 'DEMO', 'MOCK', 'ABC123'] },
    { name: 'rescue_requests', desc: 'Solicitações de Resgate', checkMock: ['test', 'mock', 'demo'] },
    { name: 'schedules', desc: 'Agendamentos', checkMock: ['test', 'mock', 'demo'] },
    { name: 'leads', desc: 'Leads', checkMock: ['test', 'mock', 'demo'] },
    { name: 'proposals', desc: 'Propostas', checkMock: ['test', 'mock', 'demo'] },
    { name: 'contracts', desc: 'Contratos', checkMock: ['test', 'mock', 'demo'] },
    { name: 'invoices', desc: 'Faturas', checkMock: ['test', 'mock', 'demo'] },
    { name: 'expenses', desc: 'Despesas', checkMock: ['test', 'mock', 'demo'] },
    { name: 'preowned_vehicles', desc: 'Seminovos', checkMock: ['test', 'mock', 'demo'] },
    { name: 'bank_accounts', desc: 'Contas Bancárias', checkMock: ['test', 'mock', 'demo'] }
  ];

  console.log('📊 Análise de Dados vs Mock:\n');

  let totalRealData = 0;
  let totalMockData = 0;
  let tablesWithMock = [];

  for (const table of tables) {
    try {
      // Contar total de registros
      const { count: totalCount, error: countError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log(`❌ ${table.desc}: Erro ao contar - ${countError.message}`);
        continue;
      }

      if (totalCount === 0) {
        console.log(`✅ ${table.desc}: 0 registros (vazio)`);
        continue;
      }

      // Buscar amostra para verificar se é mock
      const { data: sample, error: sampleError } = await supabase
        .from(table.name)
        .select('*')
        .limit(5);

      if (sampleError) {
        console.log(`❌ ${table.desc}: Erro ao buscar amostra`);
        continue;
      }

      // Verificar se é dados mock
      let isMockData = false;
      let mockReasons = [];

      for (const record of sample) {
        for (const [key, value] of Object.entries(record)) {
          if (typeof value === 'string') {
            const upperValue = value.toUpperCase();
            for (const mockIndicator of table.checkMock) {
              if (upperValue.includes(mockIndicator.toUpperCase())) {
                isMockData = true;
                mockReasons.push(`${key}: "${value}"`);
                break;
              }
            }
          }
        }
      }

      if (isMockData) {
        totalMockData += totalCount;
        tablesWithMock.push(table.name);
        console.log(`⚠️  ${table.desc}: ${totalCount} registros (PODE SER MOCK)`);
        console.log(`   Motivos: ${mockReasons.slice(0, 2).join(', ')}`);
      } else {
        totalRealData += totalCount;
        console.log(`✅ ${table.desc}: ${totalCount} registros (DADOS REAIS)`);
      }

    } catch (error) {
      console.log(`❌ ${table.desc}: Erro - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Dados Reais: ${totalRealData} registros`);
  console.log(`⚠️  Possíveis Mock: ${totalMockData} registros`);
  console.log(`📋 Tabelas com Mock: ${tablesWithMock.length}`);

  if (tablesWithMock.length > 0) {
    console.log('\n⚠️  Tabelas que podem conter dados mock:');
    tablesWithMock.forEach(table => {
      console.log(`   • ${table}`);
    });

    console.log('\n🗑️  Para limpar dados mock, use:');
    console.log('   @[supabase] execute_sql "DELETE FROM nome_tabela WHERE coluna LIKE \'%TEST%\'"');
  } else {
    console.log('\n✅ EXCELENTE! Não foram encontrados dados mock na base.');
  }

  // Verificar arquivos de código que possam ter dados mock
  console.log('\n🔍 Verificando arquivos com dados mock...');
  
  const mockFiles = [
    'src/data/mockData.ts',
    'src/data/testData.ts',
    'src/utils/mock.ts',
    'src/constants/mock.ts'
  ];

  for (const file of mockFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo mock encontrado: ${file}`);
    }
  }

  console.log('\n✅ Verificação concluída!');
}

checkProductionData();
