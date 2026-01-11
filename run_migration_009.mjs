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

console.log('📦 @[supabase] Verificando tabelas para fotos, chat e laudo...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAndCreateTables() {
  const tables = [
    { name: 'step_photos', desc: 'Fotos das Etapas' },
    { name: 'project_photos', desc: 'Fotos do Projeto' },
    { name: 'chat_messages', desc: 'Mensagens do Chat' },
    { name: 'chat_attachments', desc: 'Anexos do Chat' },
    { name: 'quote_attachments', desc: 'Anexos de Orçamentos' },
    { name: 'eliteshield_reports', desc: 'Laudos EliteShield' },
  ];

  console.log('🔍 Verificando tabelas existentes...\n');

  let missingTables = [];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table.name)
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${table.desc}: NÃO EXISTE`);
        missingTables.push(table.name);
      } else if (error) {
        console.log(`⚠️  ${table.desc}: Erro - ${error.message}`);
        missingTables.push(table.name);
      } else {
        console.log(`✅ ${table.desc}: EXISTE`);
      }
    } catch (e) {
      console.log(`❌ ${table.desc}: ERRO - ${e.message}`);
      missingTables.push(table.name);
    }
  }

  if (missingTables.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  TABELAS FALTANDO - EXECUTE O SQL ABAIXO NO SUPABASE');
    console.log('='.repeat(60));
    console.log('\n📋 Tabelas a criar:', missingTables.join(', '));
    console.log('\n🔗 Acesse: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql');
    console.log('\n📄 Execute o arquivo: supabase/migrations/009_photos_chat_sync.sql');
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('✅ TODAS AS TABELAS EXISTEM!');
    console.log('='.repeat(60));
    console.log('\n🎯 Sistema pronto para sincronização de fotos e chat.');
  }

  // Verificar Storage buckets
  console.log('\n🗂️  Verificando Storage Buckets...');
  
  const buckets = ['step-photos', 'chat-files', 'quote-files', 'project-photos'];
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        console.log(`⚠️  Bucket ${bucket}: ${error.message}`);
      } else {
        console.log(`✅ Bucket ${bucket}: OK`);
      }
    } catch (e) {
      console.log(`⚠️  Bucket ${bucket}: ${e.message}`);
    }
  }

  console.log('\n📝 Se os buckets não existem, crie-os no Supabase Dashboard:');
  console.log('   Storage > New Bucket > Nome do bucket > Public');
}

checkAndCreateTables();
