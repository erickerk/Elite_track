#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const ANON_KEY = anonKeyMatch ? anonKeyMatch[1].trim() : '';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const sqlPath = path.join(__dirname, 'create_tables.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

console.log('🚀 Executando SQL no Supabase...\n');

// Dividir em statements individuais
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

let success = 0;
let errors = 0;

for (const stmt of statements) {
  try {
    const shortStmt = stmt.substring(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`Executando: ${shortStmt}... `);
    
    // Tentar executar via rpc
    const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
    
    if (error) {
      console.log('❌');
      console.log(`  Erro: ${error.message}`);
      errors++;
    } else {
      console.log('✅');
      success++;
    }
  } catch (err) {
    console.log('❌');
    console.log(`  Erro: ${err.message}`);
    errors++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Sucesso: ${success}/${statements.length}`);
console.log(`❌ Erros: ${errors}/${statements.length}`);
console.log('='.repeat(60));

// Verificar
const { error: rescueError } = await supabase.from('rescue_requests').select('id').limit(1);
const { error: scheduleError } = await supabase.from('schedules').select('id').limit(1);

console.log('\n🔍 Verificação:');
console.log('rescue_requests:', rescueError ? '❌ NÃO EXISTE' : '✅ EXISTE');
console.log('schedules:', scheduleError ? '❌ NÃO EXISTE' : '✅ EXISTE');

if (!rescueError && !scheduleError) {
  console.log('\n✅ TABELAS CRIADAS COM SUCESSO!');
  process.exit(0);
} else {
  console.log('\n⚠️  Falha ao criar tabelas');
  process.exit(1);
}
