#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler token do .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const tokenMatch = envContent.match(/SUPABASE_TOKEN=(.+)/);
const token = tokenMatch ? tokenMatch[1].trim() : '';

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8';

console.log('🔐 Verificando configuração de segurança...\n');
console.log('✅ Token no .env:', token ? `Sim (${token.substring(0, 20)}...)` : 'NÃO ENCONTRADO');
console.log('✅ Token é diferente do anterior:', token !== 'sbp_d92a1b647685c1228839c685c792f56871e1f438' ? 'Sim' : 'NÃO - ainda é o token antigo!');
console.log('✅ .env está no .gitignore:', fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf-8').includes('.env') ? 'Sim' : 'NÃO');

console.log('\n📍 Conectando ao Supabase com ANON_KEY...\n');

// Usar ANON_KEY para verificação (não requer token de admin)
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyTables() {
  try {
    // Tentar acessar rescue_requests
    console.log('🔍 Verificando tabela rescue_requests...');
    const { data: rescueData, error: rescueError } = await supabase
      .from('rescue_requests')
      .select('id')
      .limit(1);

    if (rescueError) {
      console.log('   ❌ NÃO EXISTE');
      console.log(`   Erro: ${rescueError.message}\n`);
    } else {
      console.log('   ✅ EXISTE');
      console.log(`   Linhas: ${rescueData?.length || 0}\n`);
    }

    // Tentar acessar schedules
    console.log('🔍 Verificando tabela schedules...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedules')
      .select('id')
      .limit(1);

    if (scheduleError) {
      console.log('   ❌ NÃO EXISTE');
      console.log(`   Erro: ${scheduleError.message}\n`);
    } else {
      console.log('   ✅ EXISTE');
      console.log(`   Linhas: ${scheduleData?.length || 0}\n`);
    }

    // Resultado final
    console.log('='.repeat(60));
    if (!rescueError && !scheduleError) {
      console.log('✅ TODAS AS TABELAS FORAM CRIADAS COM SUCESSO!');
      console.log('='.repeat(60));
      console.log('\n🎉 Aplicação está pronta para usar Elite Rescue e Agendamentos!');
      process.exit(0);
    } else {
      console.log('⚠️  TABELAS NÃO ENCONTRADAS');
      console.log('='.repeat(60));
      console.log('\n📝 Próximo passo: Execute o SQL em SETUP_TABLES.md');
      console.log('   1. Abra: https://supabase.com/dashboard');
      console.log('   2. Vá para: SQL Editor');
      console.log('   3. Cole o SQL do arquivo SETUP_TABLES.md');
      console.log('   4. Clique em Run');
      console.log('   5. Execute este script novamente para verificar');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

verifyTables();
