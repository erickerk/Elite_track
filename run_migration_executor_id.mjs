#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuração do Supabase
const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibGxvaXRpa25qaWtycGJpbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAzNjI0MDAwLCJleHAiOjE4NjEzOTIwMDB9.X-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_'

// Tentar ler a chave de um arquivo .env
let supabaseKey = SUPABASE_ANON_KEY
try {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)
    if (keyMatch) {
      supabaseKey = keyMatch[1].trim()
    }
  }
} catch (err) {
  console.log('[Migration] Usando chave padrão do Supabase')
}

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function runMigration() {
  console.log('🚀 Iniciando migração: Adicionar executor_id na tabela projects')
  console.log('━'.repeat(60))

  try {
    // SQL da migração
    const migrationSQL = `
-- Adicionar coluna executor_id para rastrear qual executor está responsável pelo projeto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para consultas por executor
CREATE INDEX IF NOT EXISTS idx_projects_executor_id ON projects(executor_id);

-- Comentário explicativo
COMMENT ON COLUMN projects.executor_id IS 'ID do executor atualmente responsável pelo projeto. Permite filtrar "Meus" projetos vs "Todos"';
    `.trim()

    console.log('\n📝 SQL a executar:')
    console.log('─'.repeat(60))
    console.log(migrationSQL)
    console.log('─'.repeat(60))

    // Executar SQL via RPC
    console.log('\n⏳ Executando migração...')
    
    try {
      // Tentar executar via RPC
      const result = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      })
      
      if (result.error) {
        throw result.error
      }
      
      console.log('\n✅ Migração executada com sucesso!')
      console.log('━'.repeat(60))
      console.log('\n📊 Alterações aplicadas:')
      console.log('  ✓ Coluna executor_id adicionada à tabela projects')
      console.log('  ✓ Índice idx_projects_executor_id criado')
      console.log('  ✓ Comentário descritivo adicionado')
      
    } catch (rpcError) {
      console.log('\n⚠️  RPC não disponível, tentando via SQL direto...')
      console.log('Acesse o SQL Editor do Supabase e execute o SQL acima.')
      console.log('\n📍 Passos:')
      console.log('  1. Acesse: https://app.supabase.com/project/rlaxbloitiknjikrpbim/sql/new')
      console.log('  2. Cole o SQL acima')
      console.log('  3. Clique em "Run"')
      process.exit(0)
    }

    console.log('\n🎯 Próximos passos:')
    console.log('  1. Reiniciar o servidor: npm run dev')
    console.log('  2. Fazer login como executor (joao@teste.com)')
    console.log('  3. Testar filtro "Meus" vs "Todos"')
    console.log('  4. Testar botão "Tornar Meu"')
    console.log('\n')

  } catch (err) {
    console.error('\n❌ Erro inesperado:')
    console.error(err.message || err)
    console.log('\n📍 Solução manual:')
    console.log('  1. Acesse: https://app.supabase.com/project/rlaxbloitiknjikrpbim/sql/new')
    console.log('  2. Cole o SQL acima')
    console.log('  3. Clique em "Run"')
    process.exit(0)
  }
}

// Executar migração
runMigration()
