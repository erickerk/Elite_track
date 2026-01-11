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

console.log('🔍 Listando tabelas do Supabase...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

try {
  // Listar todas as tabelas do schema public
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_type')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')
    .order('table_name');

  if (error) {
    console.error('❌ Erro ao listar tabelas:', error.message);
    
    // Tentar método alternativo - verificar tabelas específicas
    console.log('\n🔄 Verificando tabelas conhecidas...\n');
    
    const knownTables = ['rescue_requests', 'schedules', 'users_elitetrack', 'projects'];
    
    for (const tableName of knownTables) {
      try {
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        console.log(`${tableName}: ${testError ? '❌ NÃO EXISTE' : '✅ EXISTE'}`);
      } catch (e) {
        console.log(`${tableName}: ❌ ERRO`);
      }
    }
  } else {
    console.log('📋 Tabelas encontradas:\n');
    
    if (data && data.length > 0) {
      data.forEach(table => {
        console.log(`✅ ${table.table_name}`);
      });
    } else {
      console.log('❌ Nenhuma tabela encontrada');
    }
    
    // Verificar tabelas específicas
    console.log('\n🔍 Verificando tabelas do projeto:\n');
    
    const projectTables = ['rescue_requests', 'schedules'];
    
    for (const tableName of projectTables) {
      try {
        const { data: testData, error: testError } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        console.log(`${tableName}: ${testError ? '❌ NÃO EXISTE' : '✅ EXISTE'}`);
        
        if (!testError) {
          // Mostrar estrutura básica
          const { data: columns, error: colError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .order('ordinal_position');
          
          if (!colError && columns) {
            console.log(`   Colunas: ${columns.map(c => c.column_name).join(', ')}`);
          }
        }
      } catch (e) {
        console.log(`${tableName}: ❌ ERRO`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Para usar o MCP no WindSurf:');
  console.log('   @[supabase] list_tables');
  console.log('   @[supabase] execute_sql "SELECT * FROM rescue_requests"');
  console.log('   @[supabase] create_table ...');
  console.log('='.repeat(60));
  
} catch (err) {
  console.error('❌ Erro geral:', err.message);
}
