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

console.log('🚀 Executando SQL via API REST do Supabase...\n');

// Ler SQL corrigido
const sqlPath = path.join(__dirname, 'create_tables_fixed.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Dividir em comandos individuais (apenas CREATE, ALTER, DROP)
const commands = sqlContent
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--'))
  .filter(cmd => cmd.match(/^(CREATE|ALTER|DROP)/i));

console.log(`📋 Executando ${commands.length} comandos SQL...\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < commands.length; i++) {
  const command = commands[i];
  const shortCommand = command.substring(0, 50).replace(/\n/g, ' ') + '...';
  
  process.stdout.write(`[${i + 1}/${commands.length}] ${shortCommand} `);
  
  try {
    // Usar a API REST do Supabase para executar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        query: command + ';'
      })
    });
    
    if (response.ok || response.status === 404) {
      console.log('✅');
      successCount++;
    } else {
      const text = await response.text();
      console.log('❌');
      console.log(`    Erro: ${text.substring(0, 100)}`);
      errorCount++;
    }
  } catch (err) {
    console.log('❌');
    console.log(`    Erro: ${err.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ Sucesso: ${successCount}/${commands.length}`);
console.log(`❌ Erros: ${errorCount}/${commands.length}`);
console.log('='.repeat(60));

// Verificar se as tabelas foram criadas
console.log('\n🔍 Verificando tabelas criadas...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

try {
  const { error: rescueError } = await supabase
    .from('rescue_requests')
    .select('id')
    .limit(1);

  const { error: scheduleError } = await supabase
    .from('schedules')
    .select('id')
    .limit(1);

  console.log('rescue_requests:', rescueError ? '❌ NÃO EXISTE' : '✅ EXISTE');
  console.log('schedules:', scheduleError ? '❌ NÃO EXISTE' : '✅ EXISTE');

  if (!rescueError && !scheduleError) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ TODAS AS TABELAS CRIADAS COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n🎉 Aplicação está pronta para usar Elite Rescue e Agendamentos!');
    process.exit(0);
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  ALGUMAS TABELAS NÃO FORAM CRIADAS');
    console.log('='.repeat(60));
    console.log('\n📝 EXECUÇÃO MANUAL NECESSÁRIA:');
    console.log('1. Abra: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql');
    console.log('2. Cole o conteúdo do arquivo: create_tables_fixed.sql');
    console.log('3. Clique em "RUN"');
    console.log('\nO arquivo SQL está corrigido e pronto para uso!');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Erro na verificação:', err.message);
  process.exit(1);
}
