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

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas');
  process.exit(1);
}

console.log('🚀 Executando setup do Supabase (parte por parte)...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Dividir SQL em partes menores para executar
const sqlParts = [
  // 1. Criar tabela project_photos
  {
    name: 'Criar tabela project_photos',
    sql: `CREATE TABLE IF NOT EXISTS project_photos (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      photo_type TEXT NOT NULL DEFAULT 'general',
      stage TEXT,
      description TEXT,
      taken_by TEXT,
      taken_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
  },
  {
    name: 'Criar índices em project_photos',
    sql: `CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);
          CREATE INDEX IF NOT EXISTS idx_project_photos_type ON project_photos(photo_type);`
  },
  {
    name: 'Habilitar RLS em project_photos',
    sql: `ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Criar políticas RLS em project_photos',
    sql: `DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
          CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);
          DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
          CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);
          DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
          CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);`
  },
  // 2. Adicionar colunas à chat_conversations
  {
    name: 'Adicionar colunas à chat_conversations',
    sql: `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'user_id') THEN
        ALTER TABLE chat_conversations ADD COLUMN user_id TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'title') THEN
        ALTER TABLE chat_conversations ADD COLUMN title TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'unread_count') THEN
        ALTER TABLE chat_conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'last_message_at') THEN
        ALTER TABLE chat_conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
      END IF;
    END $$;`
  },
  {
    name: 'Criar índices em chat_conversations',
    sql: `CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON chat_conversations(project_id);
          CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);`
  },
  {
    name: 'Adicionar colunas à chat_messages',
    sql: `DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'content') THEN
        ALTER TABLE chat_messages ADD COLUMN content TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE chat_messages ADD COLUMN conversation_id UUID;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'read') THEN
        ALTER TABLE chat_messages ADD COLUMN read BOOLEAN DEFAULT FALSE;
      END IF;
    END $$;`
  },
  {
    name: 'Habilitar RLS em chat_conversations',
    sql: `DO $$
    BEGIN
      ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;`
  },
  {
    name: 'Criar políticas RLS em chat_conversations',
    sql: `DROP POLICY IF EXISTS "Anyone can view chat conversations" ON chat_conversations;
          CREATE POLICY "Anyone can view chat conversations" ON chat_conversations FOR SELECT USING (true);
          DROP POLICY IF EXISTS "Anyone can insert chat conversations" ON chat_conversations;
          CREATE POLICY "Anyone can insert chat conversations" ON chat_conversations FOR INSERT WITH CHECK (true);
          DROP POLICY IF EXISTS "Anyone can update chat conversations" ON chat_conversations;
          CREATE POLICY "Anyone can update chat conversations" ON chat_conversations FOR UPDATE USING (true);`
  },
  {
    name: 'Habilitar Realtime',
    sql: `DO $$
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE project_photos;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
    DO $$
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
    DO $$
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;`
  }
];

async function executeSqlParts() {
  let successCount = 0;
  let errorCount = 0;

  for (const part of sqlParts) {
    try {
      console.log(`⏳ ${part.name}...`);
      
      // Usar uma chamada RPC genérica ou tentar via raw SQL
      // Como não temos função exec_sql, vamos tentar com query direto
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ sql: part.sql }),
      });

      if (response.ok || response.status === 201) {
        console.log(`   ✅ ${part.name}`);
        successCount++;
      } else {
        const error = await response.text();
        if (error.includes('exec_sql')) {
          console.log(`   ⚠️  Função exec_sql não disponível`);
        } else {
          console.log(`   ⚠️  ${part.name} - ${error.substring(0, 60)}`);
        }
        errorCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  ${part.name} - Erro: ${error.message.substring(0, 60)}`);
      errorCount++;
    }
    
    // Pequeno delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 Resultado: ${successCount} sucesso, ${errorCount} erros`);
  console.log('='.repeat(70));

  if (errorCount > 0) {
    console.log('\n⚠️  Como a API REST não permite exec_sql, execute manualmente:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql');
    console.log('   2. Cole o conteúdo de: SUPABASE_SETUP_SIMPLES.sql');
    console.log('   3. Clique em "Run"');
  } else {
    console.log('\n✅ Setup concluído com sucesso!');
  }
}

executeSqlParts();
