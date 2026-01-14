#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkData() {
  console.log('🔍 Verificando dados no Supabase...\n')

  try {
    // 1. Verificar usuários
    console.log('📋 USUÁRIOS:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .in('email', ['joao@teste.com', 'erick@teste.com'])

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado (joao@teste.com, erick@teste.com)')
    } else {
      users.forEach(u => {
        console.log(`  ✓ ${u.email} - ${u.name} (${u.role}) [ID: ${u.id}]`)
      })
    }

    // 2. Verificar projetos
    console.log('\n📋 PROJETOS:')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        qr_code,
        status,
        progress,
        executor_id,
        user_id,
        vehicle_id,
        users!projects_user_id_fkey (email, name),
        vehicles (plate, brand, model)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (projectsError) throw projectsError

    if (!projects || projects.length === 0) {
      console.log('❌ Nenhum projeto encontrado no banco')
    } else {
      console.log(`  Total: ${projects.length} projetos`)
      projects.forEach(p => {
        console.log(`  ✓ ${p.qr_code || 'SEM QR'} - ${p.users?.name} - ${p.vehicles?.plate} - Status: ${p.status}`)
        console.log(`    User ID: ${p.user_id} | Executor ID: ${p.executor_id || 'SEM EXECUTOR'}`)
      })
    }

    // 3. Verificar veículos
    console.log('\n📋 VEÍCULOS:')
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .limit(10)

    if (vehiclesError) throw vehiclesError

    if (!vehicles || vehicles.length === 0) {
      console.log('❌ Nenhum veículo encontrado')
    } else {
      console.log(`  Total: ${vehicles.length} veículos`)
      vehicles.forEach(v => {
        console.log(`  ✓ ${v.plate} - ${v.brand} ${v.model} (${v.year}) [ID: ${v.id}]`)
      })
    }

    // 4. Verificar timeline_steps
    console.log('\n📋 TIMELINE STEPS:')
    const { data: steps, error: stepsError } = await supabase
      .from('timeline_steps')
      .select('id, project_id, title, status')
      .limit(10)

    if (stepsError) throw stepsError

    if (!steps || steps.length === 0) {
      console.log('❌ Nenhuma timeline encontrada')
    } else {
      console.log(`  Total: ${steps.length} steps`)
    }

    // 5. Verificar fotos
    console.log('\n📋 FOTOS:')
    const { data: photos, error: photosError } = await supabase
      .from('step_photos')
      .select('id, step_id, photo_url')
      .limit(10)

    if (photosError) throw photosError

    if (!photos || photos.length === 0) {
      console.log('❌ Nenhuma foto encontrada')
    } else {
      console.log(`  Total: ${photos.length} fotos`)
    }

    console.log('\n✅ Verificação concluída!')

  } catch (error) {
    console.error('\n❌ Erro:', error)
    process.exit(1)
  }
}

checkData()
