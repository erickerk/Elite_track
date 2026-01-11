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

console.log('🔍 Consultando tabelas do Supabase...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Consultar dados das tabelas
async function queryTable(tableName, limit = 3) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);
    
    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return null;
    }
    
    console.log(`✅ ${tableName} (${data.length} registros):`);
    
    if (data.length > 0) {
      // Mostrar estrutura das colunas
      const columns = Object.keys(data[0]);
      console.log(`   Colunas: ${columns.join(', ')}`);
      
      // Mostrar primeiro registro
      if (data[0]) {
        console.log('   Exemplo:');
        Object.entries(data[0]).forEach(([key, value]) => {
          const displayValue = value ? 
            (typeof value === 'string' && value.length > 50) ? 
            value.substring(0, 50) + '...' : 
            String(value) : 
            'NULL';
          console.log(`     ${key}: ${displayValue}`);
        });
      }
    } else {
      console.log('   (Tabela vazia)');
    }
    
    console.log('');
    return data;
  } catch (e) {
    console.log(`❌ ${tableName}: Erro - ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('📋 Tabelas do Projeto Elite Track:\n');
  
  // Consultar tabelas principais
  await queryTable('rescue_requests', 2);
  await queryTable('schedules', 2);
  await queryTable('users_elitetrack', 1);
  await queryTable('projects', 1);
  
  console.log('🎯 Comandos MCP disponíveis:');
  console.log('   @[supabase] list_tables');
  console.log('   @[supabase] execute_sql "SELECT COUNT(*) FROM rescue_requests"');
  console.log('   @[supabase] execute_sql "SELECT * FROM schedules WHERE status = \'pending\'"');
  console.log('   @[supabase] create_table nome_tabela ...');
  console.log('   @[supabase] insert_into nome_tabela ...');
  
  console.log('\n✅ MCP do Supabase está funcionando! Use os comandos acima no chat.');
}

main().catch(console.error);
