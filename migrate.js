#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';
const SUPABASE_KEY = 'sbp_d92a1b647685c1228839c685c792f56871e1f438';

async function runMigration() {
  console.log('🚀 Iniciando migração do Supabase...');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');

  // Criar cliente Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Comandos SQL para executar
  const commands = [
    // Admin Master
    `INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, vip_level, created_at, updated_at)
VALUES (
  'admin-master-001',
  'Junior Rodrigues',
  'juniorrodrigues1011@gmail.com',
  '(11) 99999-9999',
  'super_admin',
  'Elite@2024#Admin!',
  true,
  'platinum',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();`,

    // Executor
    `INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, created_at, updated_at)
VALUES (
  'executor-prod-001',
  'Executor Elite',
  'executor@elite.com',
  '(11) 98888-8888',
  'executor',
  'executor123',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  updated_at = NOW();`,

    // Cliente Teste
    `INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, created_at, updated_at)
VALUES (
  'client-joao-001',
  'João Teste',
  'joao@teste.com',
  '(11) 97777-7777',
  'client',
  'Teste@2025',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  updated_at = NOW();`,
  ];

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`[${i + 1}/${commands.length}] Executando comando...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: command });
      
      if (error) {
        console.log(`❌ Erro: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ Sucesso`);
        successful++;
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Resultado Final:');
  console.log(`   ✅ Sucesso: ${successful}`);
  console.log(`   ❌ Falhas: ${failed}`);
  console.log(`   📋 Total: ${commands.length}`);
  console.log('='.repeat(60));

  // Verificar usuários criados
  console.log('\n🔍 Verificando usuários criados...');
  try {
    const { data, error } = await supabase
      .from('users_elitetrack')
      .select('id, name, email, role, is_active')
      .in('email', ['juniorrodrigues1011@gmail.com', 'executor@elite.com', 'joao@teste.com']);

    if (error) {
      console.log(`❌ Erro ao verificar: ${error.message}`);
    } else {
      console.log('\n✅ Usuários encontrados:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`❌ Erro: ${err.message}`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

runMigration().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
