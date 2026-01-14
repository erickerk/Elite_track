#!/usr/bin/env node

/**
 * Script para criar usuários no Supabase Auth usando Service Role Key
 * 
 * IMPORTANTE: Este script usa a SERVICE_ROLE_KEY que tem privilégios administrativos.
 * Nunca commitar essa chave ou expor em produção.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida')
  console.log('\n📝 Como obter a Service Role Key:')
  console.log('   1. Acesse: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/settings/api')
  console.log('   2. Copie "service_role" key (SECRET)')
  console.log('   3. Execute: SUPABASE_SERVICE_ROLE_KEY=<sua-key> node scripts/create-auth-users.mjs\n')
  process.exit(1)
}

// Cliente admin com service_role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAuthUsers() {
  console.log('👥 Criando usuários no Supabase Auth...\n')

  try {
    // 1. Criar João (executor)
    console.log('1️⃣ Criando executor João...')
    
    const { data: joaoAuth, error: joaoAuthError } = await supabase.auth.admin.createUser({
      email: 'joao@teste.com',
      password: 'teste123',
      email_confirm: true,
      user_metadata: {
        name: 'João Silva',
        role: 'executor'
      }
    })

    if (joaoAuthError) {
      if (joaoAuthError.message.includes('already registered')) {
        console.log('⚠️ João já existe no Supabase Auth')
        
        // Buscar usuário existente
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingJoao = users.find(u => u.email === 'joao@teste.com')
        
        if (existingJoao) {
          console.log(`✅ João encontrado: ${existingJoao.email} [Auth ID: ${existingJoao.id}]`)
          
          // Atualizar tabela users com Auth ID correto
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: existingJoao.id })
            .eq('email', 'joao@teste.com')
          
          if (updateError) {
            console.error('❌ Erro ao atualizar tabela users:', updateError.message)
          } else {
            console.log('✅ Tabela users atualizada com Auth ID')
          }
        }
      } else {
        throw joaoAuthError
      }
    } else if (joaoAuth.user) {
      console.log(`✅ João criado: ${joaoAuth.user.email} [Auth ID: ${joaoAuth.user.id}]`)
      
      // Sincronizar com tabela users
      const { error: syncError } = await supabase
        .from('users')
        .upsert({
          id: joaoAuth.user.id,
          email: 'joao@teste.com',
          name: 'João Silva',
          role: 'executor',
          phone: '11999999001',
          created_at: new Date().toISOString()
        }, { onConflict: 'email' })
      
      if (syncError) {
        console.error('❌ Erro ao sincronizar tabela users:', syncError.message)
      } else {
        console.log('✅ Tabela users sincronizada')
      }
    }

    // 2. Criar Erick (cliente)
    console.log('\n2️⃣ Criando cliente Erick...')
    
    const { data: erickAuth, error: erickAuthError } = await supabase.auth.admin.createUser({
      email: 'erick@teste.com',
      password: 'teste123',
      email_confirm: true,
      user_metadata: {
        name: 'Erick Kerkoski',
        role: 'client'
      }
    })

    if (erickAuthError) {
      if (erickAuthError.message.includes('already registered')) {
        console.log('⚠️ Erick já existe no Supabase Auth')
        
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingErick = users.find(u => u.email === 'erick@teste.com')
        
        if (existingErick) {
          console.log(`✅ Erick encontrado: ${existingErick.email} [Auth ID: ${existingErick.id}]`)
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: existingErick.id })
            .eq('email', 'erick@teste.com')
          
          if (updateError) {
            console.error('❌ Erro ao atualizar tabela users:', updateError.message)
          } else {
            console.log('✅ Tabela users atualizada com Auth ID')
          }
        }
      } else {
        throw erickAuthError
      }
    } else if (erickAuth.user) {
      console.log(`✅ Erick criado: ${erickAuth.user.email} [Auth ID: ${erickAuth.user.id}]`)
      
      const { error: syncError } = await supabase
        .from('users')
        .upsert({
          id: erickAuth.user.id,
          email: 'erick@teste.com',
          name: 'Erick Kerkoski',
          role: 'client',
          phone: '11999999002',
          created_at: new Date().toISOString()
        }, { onConflict: 'email' })
      
      if (syncError) {
        console.error('❌ Erro ao sincronizar tabela users:', syncError.message)
      } else {
        console.log('✅ Tabela users sincronizada')
      }
    }

    // 3. Buscar IDs finais e atualizar projetos
    console.log('\n3️⃣ Atualizando projetos...')
    
    const { data: finalJoao } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'joao@teste.com')
      .single()

    const { data: finalErick } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'erick@teste.com')
      .single()

    if (finalJoao && finalErick) {
      // Atualizar projeto do Erick para vincular ao João
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          executor_id: finalJoao.id,
          user_id: finalErick.id 
        })
        .eq('user_id', finalErick.id)

      if (projectError) {
        console.error('❌ Erro ao atualizar projetos:', projectError.message)
      } else {
        console.log('✅ Projetos atualizados com IDs corretos')
      }
    }

    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado...')
    
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        id,
        qr_code,
        status,
        progress,
        executor_id,
        users!projects_user_id_fkey (name, email)
      `)
      .eq('executor_id', finalJoao?.id)

    if (!projects || projects.length === 0) {
      console.log('⚠️ Nenhum projeto vinculado ao João')
    } else {
      console.log(`✅ ${projects.length} projeto(s) vinculado(s):`)
      projects.forEach(p => {
        console.log(`   ${p.qr_code} | ${p.users.name} | ${p.status} (${p.progress}%)`)
      })
    }

    console.log('\n✅ Usuários criados com sucesso!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Testar login: http://localhost:5175/login')
    console.log('      - joao@teste.com / teste123')
    console.log('      - erick@teste.com / teste123')
    console.log('   2. Executar testes: npx playwright test')
    console.log('   3. Verificar dashboard do executor\n')

  } catch (error) {
    console.error('\n❌ Erro:', error.message || error)
    process.exit(1)
  }
}

createAuthUsers()
