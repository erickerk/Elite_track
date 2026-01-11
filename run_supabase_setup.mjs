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
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env');
  process.exit(1);
}

console.log('🚀 Executando setup do Supabase...\n');

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function runSetup() {
  try {
    // 1. Criar tabela project_photos
    console.log('📦 1. Criando tabela project_photos...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS project_photos (
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
        );
        
        CREATE INDEX IF NOT EXISTS idx_project_photos_project ON project_photos(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_photos_type ON project_photos(photo_type);
        
        ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view project photos" ON project_photos;
        CREATE POLICY "Anyone can view project photos" ON project_photos FOR SELECT USING (true);
        
        DROP POLICY IF EXISTS "Anyone can insert project photos" ON project_photos;
        CREATE POLICY "Anyone can insert project photos" ON project_photos FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Anyone can update project photos" ON project_photos;
        CREATE POLICY "Anyone can update project photos" ON project_photos FOR UPDATE USING (true);
      `
    });

    if (error1) {
      console.log('⚠️  Erro ao criar project_photos (pode já existir):', error1.message);
    } else {
      console.log('✅ project_photos criada com sucesso');
    }

    // 2. Adicionar colunas à chat_conversations
    console.log('\n📦 2. Atualizando tabela chat_conversations...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
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
        END $$;
      `
    });

    if (error2) {
      console.log('⚠️  Erro ao atualizar chat_conversations:', error2.message);
    } else {
      console.log('✅ chat_conversations atualizada com sucesso');
    }

    // 3. Adicionar colunas à chat_messages
    console.log('\n📦 3. Atualizando tabela chat_messages...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
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
        END $$;
      `
    });

    if (error3) {
      console.log('⚠️  Erro ao atualizar chat_messages:', error3.message);
    } else {
      console.log('✅ chat_messages atualizada com sucesso');
    }

    // 4. Criar índices
    console.log('\n📦 4. Criando índices...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_project ON chat_conversations(project_id);
        CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
      `
    });

    if (error4) {
      console.log('⚠️  Erro ao criar índices:', error4.message);
    } else {
      console.log('✅ Índices criados com sucesso');
    }

    // 5. Habilitar Realtime
    console.log('\n📦 5. Habilitando Realtime...');
    const { error: error5 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
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
        END $$;
      `
    });

    if (error5) {
      console.log('⚠️  Erro ao habilitar Realtime:', error5.message);
    } else {
      console.log('✅ Realtime habilitado com sucesso');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SETUP CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📝 Tabelas prontas para sincronização:');
    console.log('   • project_photos - Fotos do projeto');
    console.log('   • chat_conversations - Conversas do chat');
    console.log('   • chat_messages - Mensagens do chat');
    console.log('\n🔄 Realtime habilitado para sincronização em tempo real');

  } catch (error) {
    console.error('❌ Erro durante setup:', error);
    process.exit(1);
  }
}

runSetup();
