#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler configuração do .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_KEY=(.+)/) || envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const SERVICE_KEY = serviceKeyMatch ? serviceKeyMatch[1].trim() : '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontrados no .env');
  console.error('   Você precisa adicionar a SERVICE_KEY ao arquivo .env');
  process.exit(1);
}

console.log('🚀 Executando setup do Supabase via API REST...\n');

const sqlStatements = [
  // 1. Criar tabela project_photos
  `CREATE TABLE IF NOT EXISTS project_photos (
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
  );`,

  `CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_project_photos_type ON project_photos(photo_type);`,

  `ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;`,

  `DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
   CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);`,

  `DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
   CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
   CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);`,

  // 2. Adicionar colunas à chat_conversations
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_conversations' AND column_name = 'user_id'
     ) THEN
       ALTER TABLE chat_conversations ADD COLUMN user_id TEXT;
     END IF;
     
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_conversations' AND column_name = 'title'
     ) THEN
       ALTER TABLE chat_conversations ADD COLUMN title TEXT;
     END IF;
     
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_conversations' AND column_name = 'unread_count'
     ) THEN
       ALTER TABLE chat_conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
     END IF;
     
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_conversations' AND column_name = 'last_message_at'
     ) THEN
       ALTER TABLE chat_conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
     END IF;
   END $$;`,

  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON chat_conversations(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);`,

  // 3. Adicionar colunas à chat_messages
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_messages' AND column_name = 'content'
     ) THEN
       ALTER TABLE chat_messages ADD COLUMN content TEXT;
     END IF;
     
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_messages' AND column_name = 'conversation_id'
     ) THEN
       ALTER TABLE chat_messages ADD COLUMN conversation_id UUID;
     END IF;
     
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns 
       WHERE table_name = 'chat_messages' AND column_name = 'read'
     ) THEN
       ALTER TABLE chat_messages ADD COLUMN read BOOLEAN DEFAULT FALSE;
     END IF;
   END $$;`,

  // 4. Habilitar RLS
  `DO $$
   BEGIN
     ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
   EXCEPTION WHEN OTHERS THEN NULL;
   END $$;`,

  // 5. Criar políticas RLS
  `DROP POLICY IF EXISTS "Anyone can view chat conversations" ON chat_conversations;
   CREATE POLICY "Anyone can view chat conversations" ON chat_conversations FOR SELECT USING (true);`,

  `DROP POLICY IF EXISTS "Anyone can insert chat conversations" ON chat_conversations;
   CREATE POLICY "Anyone can insert chat conversations" ON chat_conversations FOR INSERT WITH CHECK (true);`,

  `DROP POLICY IF EXISTS "Anyone can update chat conversations" ON chat_conversations;
   CREATE POLICY "Anyone can update chat conversations" ON chat_conversations FOR UPDATE USING (true);`,

  // 6. Habilitar Realtime
  `DO $$
   BEGIN
     ALTER PUBLICATION supabase_realtime ADD TABLE project_photos;
   EXCEPTION WHEN OTHERS THEN NULL;
   END $$;`,

  `DO $$
   BEGIN
     ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
   EXCEPTION WHEN OTHERS THEN NULL;
   END $$;`,

  `DO $$
   BEGIN
     ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
   EXCEPTION WHEN OTHERS THEN NULL;
   END $$;`,
];

async function executeSql() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i].trim();
    if (!sql) continue;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
        },
        body: JSON.stringify({ sql }),
      });

      if (response.ok) {
        console.log(`✅ SQL ${i + 1}/${sqlStatements.length} executado`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`⚠️  SQL ${i + 1}/${sqlStatements.length} - ${error.substring(0, 80)}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`⚠️  SQL ${i + 1}/${sqlStatements.length} - Erro de conexão`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Execução concluída: ${successCount} sucesso, ${errorCount} erros`);
  console.log('='.repeat(60));
  console.log('\n📝 Se recebeu erros, execute manualmente no Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql');
  console.log('\n📄 Use o arquivo: SUPABASE_SETUP_SIMPLES.sql');
}

executeSql();
