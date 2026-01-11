import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_TOKEN || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas no .env')
  process.exit(1)
}

console.log('🔧 Conectando ao Supabase...')
const supabase = createClient(supabaseUrl, supabaseKey)

// Ler SQL
const sqlFile = 'supabase/migrations/011_schedules_table.sql'
console.log(`📄 Lendo SQL de: ${sqlFile}`)
const sql = readFileSync(sqlFile, 'utf8')

// Dividir SQL em comandos individuais (ignorar comentários)
const commands = sql
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--'))

console.log(`\n✅ Executando ${commands.length} comandos SQL...\n`)

// Executar cada comando
for (let i = 0; i < commands.length; i++) {
  const cmd = commands[i]
  if (!cmd) continue
  
  console.log(`[${i + 1}/${commands.length}] Executando...`)
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: cmd + ';' })
    
    if (error) {
      console.error(`❌ Erro no comando ${i + 1}:`, error.message)
      console.log('Comando:', cmd.substring(0, 100) + '...')
      
      // Se exec_sql não existe, informar
      if (error.message.includes('exec_sql')) {
        console.log('\n⚠️  A função exec_sql não está disponível.')
        console.log('💡 Solução: Execute o SQL manualmente no Supabase Dashboard:')
        console.log('   https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql')
        process.exit(1)
      }
    } else {
      console.log(`✓ Comando ${i + 1} executado com sucesso`)
    }
  } catch (err) {
    console.error(`❌ Erro inesperado no comando ${i + 1}:`, err.message)
  }
}

console.log('\n✅ Script concluído!')
console.log('\n📋 Verificando se a tabela foi criada...')

// Verificar se a tabela existe
try {
  const { data, error } = await supabase
    .from('schedules')
    .select('count')
    .limit(0)
  
  if (!error) {
    console.log('✅ Tabela schedules criada com sucesso!')
  } else {
    console.log('⚠️  Tabela schedules não encontrada. Execute o SQL manualmente.')
  }
} catch (err) {
  console.log('⚠️  Não foi possível verificar a tabela.')
}
