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
const tokenMatch = envContent.match(/SUPABASE_TOKEN=(.+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const ANON_KEY = anonKeyMatch ? anonKeyMatch[1].trim() : '';
const SERVICE_KEY = tokenMatch ? tokenMatch[1].trim() : '';

console.log('🔍 Testando diferentes chaves do Supabase...\n');

// Testar com ANON_KEY
console.log('1️⃣  Testando com ANON_KEY...');
const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY);

try {
  const { data, error } = await supabaseAnon
    .from('rescue_requests')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('   ❌ Erro:', error.message);
  } else {
    console.log('   ✅ Conectado com ANON_KEY');
  }
} catch (e) {
  console.log('   ❌ Erro:', e.message);
}

// Testar com SERVICE_KEY
console.log('\n2️⃣  Testando com SERVICE_KEY...');
const supabaseService = createClient(SUPABASE_URL, SERVICE_KEY);

try {
  const { data, error } = await supabaseService
    .from('rescue_requests')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('   ❌ Erro:', error.message);
  } else {
    console.log('   ✅ Conectado com SERVICE_KEY');
  }
} catch (e) {
  console.log('   ❌ Erro:', e.message);
}

// Testar se consegue criar uma tabela simples
console.log('\n3️⃣  Testando criar tabela de teste...');
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ 
      query: 'SELECT 1 as test;'
    }),
  });
  
  if (response.ok) {
    console.log('   ✅ RPC exec_sql funciona');
  } else {
    const text = await response.text();
    console.log('   ❌ RPC exec_sql não funciona:', text.substring(0, 100));
  }
} catch (e) {
  console.log('   ❌ Erro RPC:', e.message);
}

// Listar tabelas existentes
console.log('\n4️⃣  Listando tabelas existentes...');
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
  });
  
  if (response.ok) {
    console.log('   ✅ Conexão REST API funciona');
  } else {
    console.log('   ❌ Erro REST API:', response.status);
  }
} catch (e) {
  console.log('   ❌ Erro REST API:', e.message);
}

console.log('\n' + '='.repeat(60));
console.log('📊 Diagnóstico completo');
console.log('='.repeat(60));
console.log('URL:', SUPABASE_URL);
console.log('ANON_KEY:', ANON_KEY.substring(0, 20) + '...');
console.log('SERVICE_KEY:', SERVICE_KEY.substring(0, 20) + '...');

console.log('\n🔧 Soluções:');
console.log('1. Se RPC não funciona, use SQL Editor manual');
console.log('2. Se SERVICE_KEY funciona, pode criar tabelas via código');
console.log('3. Se só ANON_KEY funciona, só pode ler dados');
