#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testQuery() {
  console.log('=== TESTE DA QUERY DE PROJETOS ===\n')

  // Mesma query usada pelo SupabaseAdapter
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      vehicles (
        *,
        vehicle_images (*)
      ),
      users!projects_user_id_fkey (*),
      timeline_steps (
        *,
        step_photos (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.log('❌ ERRO NA QUERY:', error.message)
    console.log('Código:', error.code)
    console.log('Detalhes:', error.details)
    console.log('Hint:', error.hint)
    return
  }

  console.log(`✅ ${projects?.length || 0} projetos encontrados\n`)

  if (projects && projects.length > 0) {
    projects.forEach((p, i) => {
      console.log(`📋 Projeto ${i + 1}:`)
      console.log(`  ID: ${p.id}`)
      console.log(`  QR Code: ${p.qr_code}`)
      console.log(`  Status: ${p.status}`)
      console.log(`  User ID: ${p.user_id}`)
      console.log(`  Executor ID: ${p.executor_id}`)
      console.log(`  Vehicle: ${p.vehicles?.brand} ${p.vehicles?.model} - ${p.vehicles?.plate}`)
      console.log(`  User: ${p.users?.name} (${p.users?.email})`)
      console.log(`  Timeline Steps: ${p.timeline_steps?.length || 0}`)
      
      let totalPhotos = 0
      p.timeline_steps?.forEach(step => {
        totalPhotos += step.step_photos?.length || 0
      })
      console.log(`  Total Fotos: ${totalPhotos}`)
      console.log('')
    })
  } else {
    console.log('⚠️ Nenhum projeto retornado pela query')
    console.log('\nVerificando se existem projetos sem join...')
    
    const { data: rawProjects } = await supabase
      .from('projects')
      .select('id, qr_code, status')
    
    console.log(`Projetos (raw): ${rawProjects?.length || 0}`)
    rawProjects?.forEach(p => console.log(`  - ${p.id}: ${p.qr_code}`))
  }
}

testQuery()
