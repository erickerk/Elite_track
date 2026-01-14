#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function verify() {
  console.log('=== VERIFICAÇÃO FINAL DO SISTEMA ===\n')

  // 1. Verificar projeto
  const { data: project } = await supabase
    .from('projects')
    .select('id, qr_code, status, progress, user_id, executor_id')
    .eq('id', '40c902a1-c0e4-44ab-b211-cceccdd73c86')
    .single()

  console.log('📋 PROJETO:')
  console.log(`  Status: ${project?.status}`)
  console.log(`  Progress: ${project?.progress}%`)
  console.log(`  User ID: ${project?.user_id}`)
  console.log(`  Executor ID: ${project?.executor_id}`)
  console.log(`  QR Code: ${project?.qr_code}`)

  // 2. Verificar usuários
  console.log('\n👤 USUÁRIOS (users_elitetrack):')
  const { data: authUsers } = await supabase
    .from('users_elitetrack')
    .select('id, email, name, role')
    .in('email', ['joao@teste.com', 'erick@teste.com'])

  authUsers?.forEach(u => {
    console.log(`  ${u.email} - ${u.name} (${u.role}) - ID: ${u.id}`)
  })

  // 3. Verificar fotos
  const { data: photos } = await supabase
    .from('step_photos')
    .select('id')
  
  console.log(`\n📸 FOTOS: ${photos?.length || 0} fotos no banco`)

  // 4. Verificar timeline
  const { data: steps } = await supabase
    .from('timeline_steps')
    .select('id, title, status')
    .eq('project_id', '40c902a1-c0e4-44ab-b211-cceccdd73c86')
  
  console.log(`\n📅 TIMELINE: ${steps?.length || 0} etapas`)

  // 5. Validação
  console.log('\n✅ VALIDAÇÃO:')
  const joao = authUsers?.find(u => u.email === 'joao@teste.com')
  const erick = authUsers?.find(u => u.email === 'erick@teste.com')

  const joaoMatch = joao?.id === project?.executor_id
  const erickMatch = erick?.id === project?.user_id

  console.log(`  João (executor) ID match: ${joaoMatch ? '✓' : '✗'}`)
  console.log(`  Erick (cliente) ID match: ${erickMatch ? '✓' : '✗'}`)
  console.log(`  Status in_progress: ${project?.status === 'in_progress' ? '✓' : '✗'}`)
  console.log(`  Fotos disponíveis: ${(photos?.length || 0) > 0 ? '✓' : '✗'}`)
  console.log(`  Timeline configurada: ${(steps?.length || 0) > 0 ? '✓' : '✗'}`)

  if (joaoMatch && erickMatch && project?.status === 'in_progress') {
    console.log('\n🎉 SISTEMA CONFIGURADO CORRETAMENTE!')
    console.log('\n📱 TESTE AGORA:')
    console.log('  1. Faça logout se estiver logado')
    console.log('  2. Login executor: joao@teste.com / Teste@2025')
    console.log('  3. Deve ver projeto do Erick no dashboard')
    console.log('  4. Login cliente: erick@teste.com / Teste@2025')
    console.log('  5. Deve ver seu projeto com fotos')
  } else {
    console.log('\n⚠️ AINDA HÁ PROBLEMAS PARA CORRIGIR')
  }
}

verify()
