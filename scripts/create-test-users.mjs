#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createTestUsers() {
  console.log('👥 Criando usuários de teste...\n')

  try {
    // 1. Buscar Erick existente
    console.log('1️⃣ Verificando usuário Erick...')
    const { data: erick } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'erick@teste.com')
      .single()

    if (!erick) {
      console.log('❌ Cliente Erick não encontrado - crie via UI primeiro')
      return
    }
    console.log(`✅ Erick encontrado: ${erick.email} [ID: ${erick.id}]`)

    // 2. Criar/Verificar João
    console.log('\n2️⃣ Verificando/Criando executor João...')
    let joaoId = null

    // Verificar se João já existe na tabela users
    const { data: existingJoao } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'joao@teste.com')
      .single()

    if (existingJoao) {
      console.log(`✅ João já existe: ${existingJoao.email} [ID: ${existingJoao.id}]`)
      joaoId = existingJoao.id
    } else {
      // Inserir João na tabela users
      console.log('📝 Inserindo João na tabela users...')
      const { data: newJoao, error: insertError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(), // Gerar UUID manualmente
          email: 'joao@teste.com',
          name: 'João Silva',
          role: 'executor',
          phone: '11999999001',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erro ao inserir João:', insertError.message)
        return
      }

      joaoId = newJoao.id
      console.log(`✅ João criado: ${newJoao.email} [ID: ${joaoId}]`)
    }

    // 3. Vincular executor ao projeto do Erick
    console.log('\n3️⃣ Vinculando executor ao projeto...')
    const { data: projects } = await supabase
      .from('projects')
      .select('id, qr_code, user_id')
      .eq('user_id', erick.id)

    if (!projects || projects.length === 0) {
      console.log('❌ Nenhum projeto do Erick encontrado')
      return
    }

    console.log(`📋 ${projects.length} projeto(s) encontrado(s)`)

    for (const project of projects) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ executor_id: joaoId })
        .eq('id', project.id)

      if (updateError) {
        console.error(`❌ Erro ao vincular executor: ${updateError.message}`)
      } else {
        console.log(`✅ Projeto ${project.qr_code} vinculado ao João`)
      }
    }

    // 4. Verificar resultado
    console.log('\n4️⃣ Verificando resultado...')
    const { data: finalProjects, error: queryError } = await supabase
      .from('projects')
      .select(`
        id,
        qr_code,
        status,
        progress,
        executor_id,
        users!projects_user_id_fkey (name, email)
      `)
      .eq('executor_id', joaoId)

    if (queryError) {
      console.error('❌ Erro na query:', queryError.message)
      return
    }

    if (!finalProjects || finalProjects.length === 0) {
      console.log('⚠️ Nenhum projeto encontrado com executor_id')
    } else {
      console.log(`✅ ${finalProjects.length} projeto(s) vinculado(s) ao João:`)
      finalProjects.forEach(p => {
        console.log(`   ${p.qr_code} | ${p.users.name} | ${p.status} (${p.progress}%)`)
      })
    }

    console.log('\n✅ Setup concluído!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Criar senha para joao@teste.com via Supabase Auth Dashboard')
    console.log('   2. Ou fazer login via link de convite')
    console.log('   3. Acessar http://localhost:5175/dashboard')
    console.log('   4. ExecutorDashboard deve mostrar projetos\n')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
  }
}

createTestUsers()
