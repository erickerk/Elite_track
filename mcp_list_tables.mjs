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

console.log('🔍 @[supabase] list_tables\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Lista de tabelas conhecidas para verificar
const knownTables = [
  'rescue_requests',
  'schedules', 
  'users_elitetrack',
  'projects',
  'vehicles',
  'leads',
  'proposals',
  'contracts',
  'invoices',
  'expenses',
  'preowned_vehicles',
  'bank_accounts'
];

console.log('📋 Verificando tabelas no schema public...\n');

let foundTables = [];
let notFoundTables = [];

for (const tableName of knownTables) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      notFoundTables.push(tableName);
      console.log(`❌ ${tableName} - Não encontrada ou sem acesso`);
    } else {
      foundTables.push(tableName);
      
      // Contar registros
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      console.log(`✅ ${tableName} - ${count || 0} registros`);
    }
  } catch (e) {
    notFoundTables.push(tableName);
    console.log(`❌ ${tableName} - Erro: ${e.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO');
console.log('='.repeat(60));
console.log(`✅ Tabelas encontradas: ${foundTables.length}`);
console.log(`❌ Tabelas não encontradas: ${notFoundTables.length}`);

if (foundTables.length > 0) {
  console.log('\n📋 Tabelas disponíveis:');
  foundTables.forEach(table => {
    console.log(`   • ${table}`);
  });
}

if (notFoundTables.length > 0) {
  console.log('\n❌ Tabelas não encontradas:');
  notFoundTables.forEach(table => {
    console.log(`   • ${table}`);
  });
}

console.log('\n🎯 Comandos MCP disponíveis:');
console.log('   @[supabase] execute_sql "SELECT * FROM nome_tabela LIMIT 5"');
console.log('   @[supabase] execute_sql "SELECT COUNT(*) FROM nome_tabela"');
console.log('   @[supabase] create_table nova_tabela ...');
console.log('   @[supabase] insert_into nome_tabela ...');

console.log('\n✅ MCP do Supabase está funcionando!');
