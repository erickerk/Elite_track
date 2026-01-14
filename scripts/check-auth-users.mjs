#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkAuth() {
  console.log('🔐 Verificando autenticação dos usuários produtivos...\n')

  try {
    // Tentar login com João
    console.log('1️⃣ Testando login: joao@teste.com')
    const { data: joaoAuth, error: joaoError } = await supabase.auth.signInWithPassword({
      email: 'joao@teste.com',
      password: 'teste123'
    })

    if (joaoError) {
      console.log('❌ João - Falha no login:', joaoError.message)
      console.log('   Possível causa: Usuário não existe no Supabase Auth ou senha incorreta')
    } else if (joaoAuth.user) {
      console.log('✅ João - Login bem-sucedido!')
      console.log(`   Auth ID: ${joaoAuth.user.id}`)
      console.log(`   Email: ${joaoAuth.user.email}`)
      await supabase.auth.signOut()
    }

    // Tentar login com Erick
    console.log('\n2️⃣ Testando login: erick@teste.com')
    const { data: erickAuth, error: erickError } = await supabase.auth.signInWithPassword({
      email: 'erick@teste.com',
      password: 'teste123'
    })

    if (erickError) {
      console.log('❌ Erick - Falha no login:', erickError.message)
      console.log('   Possível causa: Usuário não existe no Supabase Auth ou senha incorreta')
    } else if (erickAuth.user) {
      console.log('✅ Erick - Login bem-sucedido!')
      console.log(`   Auth ID: ${erickAuth.user.id}`)
      console.log(`   Email: ${erickAuth.user.email}`)
      await supabase.auth.signOut()
    }

    console.log('\n📋 RESUMO:')
    console.log('─────────────────────────────────────────')
    
    if (joaoError && erickError) {
      console.log('❌ PROBLEMA: Nenhum usuário tem autenticação configurada')
      console.log('\n🔧 SOLUÇÃO:')
      console.log('   Os usuários existem na tabela "users" mas não no Supabase Auth.')
      console.log('   Você precisa criar autenticação para eles via:')
      console.log('   1. Dashboard Supabase: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/auth/users')
      console.log('   2. Ou via SQL (se tiver service_role key):\n')
      console.log('   -- No dashboard Supabase, vá em Authentication → Add User')
      console.log('   -- Email: joao@teste.com | Password: teste123')
      console.log('   -- Email: erick@teste.com | Password: teste123')
    } else if (joaoError || erickError) {
      console.log('⚠️ ATENÇÃO: Apenas um usuário tem autenticação')
      if (joaoError) console.log('   - joao@teste.com: SEM autenticação')
      if (erickError) console.log('   - erick@teste.com: SEM autenticação')
    } else {
      console.log('✅ SUCESSO: Ambos usuários têm autenticação configurada')
      console.log('   Testes Playwright devem funcionar!')
    }

    console.log('\n')

  } catch (error) {
    console.error('❌ Erro:', error.message || error)
  }
}

checkAuth()
