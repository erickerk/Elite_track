#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fixData() {
  console.log('🔧 Corrigindo dados no Supabase...\n')

  try {
    // 1. Criar/Atualizar executor João
    console.log('1️⃣ Criando executor João...')
    const { data: joaoUser, error: joaoError } = await supabase
      .from('users')
      .upsert({
        email: 'joao@teste.com',
        name: 'João Silva',
        role: 'executor',
        phone: '11999999001',
        password: 'teste123' // Hash será feito pelo sistema
      }, { onConflict: 'email' })
      .select()
      .single()

    if (joaoError && joaoError.code !== '23505') {
      console.error('❌ Erro ao criar João:', joaoError)
      // Tentar buscar se já existe
      const { data: existingJoao } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', 'joao@teste.com')
        .single()
      
      if (existingJoao) {
        console.log(`✅ João já existe: ${existingJoao.email} [ID: ${existingJoao.id}]`)
      }
    } else if (joaoUser) {
      console.log(`✅ João criado: ${joaoUser.email} [ID: ${joaoUser.id}]`)
    }

    // 2. Buscar IDs necessários
    const { data: joao } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'joao@teste.com')
      .single()

    const { data: erick } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'erick@teste.com')
      .single()

    if (!joao) {
      console.error('❌ Executor João não encontrado')
      return
    }

    if (!erick) {
      console.error('❌ Cliente Erick não encontrado')
      return
    }

    console.log(`\n2️⃣ IDs encontrados:`)
    console.log(`   João (executor): ${joao.id}`)
    console.log(`   Erick (cliente): ${erick.id}`)

    // 3. Buscar projeto do Erick
    const { data: projects } = await supabase
      .from('projects')
      .select('id, qr_code, executor_id, user_id')
      .eq('user_id', erick.id)

    if (!projects || projects.length === 0) {
      console.log('\n❌ Nenhum projeto do Erick encontrado')
      return
    }

    console.log(`\n3️⃣ Projetos do Erick encontrados: ${projects.length}`)

    // 4. Atualizar executor_id em todos os projetos do Erick
    for (const project of projects) {
      console.log(`\n   Atualizando projeto ${project.qr_code}...`)
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ executor_id: joao.id })
        .eq('id', project.id)

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar: ${updateError.message}`)
      } else {
        console.log(`   ✅ Executor João vinculado ao projeto`)
      }
    }

    // 5. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...')
    const { data: finalProjects } = await supabase
      .from('projects')
      .select(`
        id,
        qr_code,
        status,
        progress,
        executor_id,
        users!projects_user_id_fkey (name, email)
      `)
      .eq('executor_id', joao.id)

    if (!finalProjects || finalProjects.length === 0) {
      console.log('❌ Executor João ainda não tem projetos vinculados')
    } else {
      console.log(`✅ Executor João agora tem ${finalProjects.length} projeto(s):`)
      finalProjects.forEach(p => {
        console.log(`   - ${p.qr_code} | Cliente: ${p.users.name} | Status: ${p.status} (${p.progress}%)`)
      })
    }

    console.log('\n✅ Correção concluída com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Login como joao@teste.com / teste123')
    console.log('   2. Dashboard deve mostrar projeto do Erick')
    console.log('   3. Testar filtros "Meus" vs "Todos"')
    console.log('   4. Testar QR scanner na rota /scan\n')

  } catch (error) {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  }
}

fixData()
