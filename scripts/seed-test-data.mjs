#!/usr/bin/env node

/**
 * Seed de dados de teste — Elite Track
 * 
 * Limpa dados antigos de teste e gera nova massa completa:
 * - Admin, Executor, Cliente
 * - Veículo com blindagem
 * - Projeto com 9 etapas (timeline Sprint 2)
 * - Fotos nas etapas concluídas
 * - Notificações de exemplo
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const TEST_EMAILS = ['erick@teste.com', 'joao@teste.com']
const ADMIN_EMAIL = 'juniorrodrigues1011@gmail.com'

async function cleanOldTestData() {
  console.log('🧹 Limpando dados de teste antigos...\n')

  // Buscar users de teste (exceto admin)
  const { data: testUsers } = await supabase
    .from('users')
    .select('id')
    .in('email', TEST_EMAILS)

  if (testUsers && testUsers.length > 0) {
    const userIds = testUsers.map(u => u.id)

    // Buscar projetos desses users
    const { data: projects } = await supabase
      .from('projects')
      .select('id, vehicle_id')
      .in('user_id', userIds)

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id)
      const vehicleIds = [...new Set(projects.map(p => p.vehicle_id).filter(Boolean))]

      // Buscar steps dos projetos
      const { data: steps } = await supabase
        .from('timeline_steps')
        .select('id')
        .in('project_id', projectIds)

      if (steps && steps.length > 0) {
        const stepIds = steps.map(s => s.id)
        await supabase.from('step_photos').delete().in('step_id', stepIds)
        console.log('  - step_photos deletadas')
      }

      await supabase.from('timeline_steps').delete().in('project_id', projectIds)
      console.log('  - timeline_steps deletadas')

      await supabase.from('blinding_specs').delete().in('project_id', projectIds)
      console.log('  - blinding_specs deletadas')

      await supabase.from('notifications').delete().in('user_id', userIds)
      console.log('  - notifications deletadas')

      await supabase.from('projects').delete().in('id', projectIds)
      console.log('  - projects deletados')

      if (vehicleIds.length > 0) {
        await supabase.from('vehicle_images').delete().in('vehicle_id', vehicleIds)
        await supabase.from('vehicles').delete().in('id', vehicleIds)
        console.log('  - vehicles deletados')
      }
    }

    // Deletar users de teste (manter admin)
    await supabase.from('users').delete().in('email', TEST_EMAILS)
    console.log('  - test users deletados')
  }

  console.log('✅ Limpeza concluida\n')
}

async function seedTestData() {
  console.log('🌱 Gerando nova massa de teste...\n')

  // 1. Executor
  console.log('👷 Criando executor...')
  const { data: executor, error: exErr } = await supabase
    .from('users')
    .upsert({
      name: 'Joao Executor',
      email: 'joao@teste.com',
      phone: '11999990001',
      role: 'executor',
      password_hash: 'teste123',
      requires_password_change: false
    }, { onConflict: 'email' })
    .select()
    .single()
  if (exErr) throw exErr
  console.log(`  ✅ Executor: ${executor.id}`)

  // 2. Cliente
  console.log('👤 Criando cliente...')
  const { data: client, error: clErr } = await supabase
    .from('users')
    .upsert({
      name: 'Erick Kerkoski',
      email: 'erick@teste.com',
      phone: '11999990002',
      role: 'client',
      password_hash: 'teste123',
      requires_password_change: false
    }, { onConflict: 'email' })
    .select()
    .single()
  if (clErr) throw clErr
  console.log(`  ✅ Cliente: ${client.id}`)

  // 3. Veiculo
  console.log('🚗 Criando veiculo...')
  const { data: vehicle, error: vhErr } = await supabase
    .from('vehicles')
    .upsert({
      brand: 'BMW',
      model: 'X5 xDrive40i',
      year: 2024,
      color: 'Preto Safira',
      plate: 'ELT-2E25',
      blinding_level: 'NIJ III-A'
    }, { onConflict: 'plate' })
    .select()
    .single()
  if (vhErr) throw vhErr
  console.log(`  ✅ Veiculo: ${vehicle.id}`)

  // 4. Imagem do veiculo
  await supabase.from('vehicle_images').insert({
    vehicle_id: vehicle.id,
    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
    is_primary: true
  })

  // 5. Projeto in_progress (65%)
  console.log('📋 Criando projeto...')
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 20)
  const estDelivery = new Date()
  estDelivery.setDate(estDelivery.getDate() + 15)

  const { data: project, error: prjErr } = await supabase
    .from('projects')
    .insert({
      user_id: client.id,
      vehicle_id: vehicle.id,
      executor_id: executor.id,
      status: 'in_progress',
      progress: 55,
      start_date: startDate.toISOString(),
      estimated_delivery: estDelivery.toISOString(),
      vehicle_received_date: startDate.toISOString(),
      process_start_date: new Date(startDate.getTime() + 3 * 86400000).toISOString(),
      qr_code: `QR-${Date.now()}`
    })
    .select()
    .single()
  if (prjErr) throw prjErr
  console.log(`  ✅ Projeto: ${project.id}`)

  // 6. Timeline 9 etapas (Sprint 2)
  console.log('📅 Criando timeline (9 etapas)...')
  const timelineSteps = [
    { title: 'Recebimento do Veiculo', description: 'Inspecao inicial e documentacao', status: 'completed', sort_order: 0 },
    { title: 'Liberacao do Exercito', description: 'Autorizacao do Exercito Brasileiro para blindagem', status: 'completed', sort_order: 1 },
    { title: 'Desmontagem', description: 'Remocao de pecas e preparacao', status: 'completed', sort_order: 2 },
    { title: 'Instalacao de Blindagem', description: 'Aplicacao dos materiais balisticos', status: 'completed', sort_order: 3 },
    { title: 'Vidros Blindados', description: 'Instalacao dos vidros laminados multi-camadas', status: 'in_progress', sort_order: 4 },
    { title: 'Montagem Final', description: 'Remontagem e ajustes finais', status: 'pending', sort_order: 5 },
    { title: 'Testes e Qualidade', description: 'Verificacao de funcionamento e qualidade', status: 'pending', sort_order: 6 },
    { title: 'Liberacao do Exercito', description: 'Vistoria e liberacao final pelo Exercito', status: 'pending', sort_order: 7 },
    { title: 'Entrega', description: 'Entrega do veiculo blindado ao cliente', status: 'pending', sort_order: 8 },
  ]

  for (const step of timelineSteps) {
    const dayOffset = step.sort_order * 4
    const stepDate = step.status !== 'pending' 
      ? new Date(startDate.getTime() + dayOffset * 86400000).toISOString() 
      : null

    const { data: stepData, error: stErr } = await supabase
      .from('timeline_steps')
      .insert({
        project_id: project.id,
        title: step.title,
        description: step.description,
        status: step.status,
        sort_order: step.sort_order,
        date: stepDate,
        estimated_date: new Date(startDate.getTime() + dayOffset * 86400000).toISOString(),
        technician: step.status === 'completed' ? 'Joao Executor' : null
      })
      .select()
      .single()
    if (stErr) throw stErr

    // Fotos para etapas completas
    if (step.status === 'completed') {
      await supabase.from('step_photos').insert([
        { step_id: stepData.id, photo_url: `https://placehold.co/800x600/1a1a1a/D4AF37?text=${encodeURIComponent(step.title)}` },
        { step_id: stepData.id, photo_url: `https://placehold.co/800x600/0a0a0a/FFD700?text=${encodeURIComponent(step.title)}+2` }
      ])
    }
  }
  console.log('  ✅ 9 etapas criadas com fotos')

  // 7. Blinding specs
  console.log('🛡️  Criando specs de blindagem...')
  await supabase.from('blinding_specs').insert({
    project_id: project.id,
    level: 'NIJ III-A',
    certification: 'Ultra Lite Armor',
    glass_type: 'SafeMax CrystalGard',
    glass_thickness: '21mm',
    warranty: '10 anos',
    technical_responsible: 'Joao Executor'
  })
  console.log('  ✅ Specs criadas')

  // 8. Notificacoes de exemplo
  console.log('🔔 Criando notificacoes...')
  await supabase.from('notifications').insert([
    { user_id: client.id, title: 'Etapa concluida', message: 'A desmontagem do seu veiculo foi concluida com sucesso.', type: 'success', read: true, project_id: project.id },
    { user_id: client.id, title: 'Blindagem em andamento', message: 'Os vidros blindados estao sendo instalados no seu BMW X5.', type: 'info', read: false, project_id: project.id },
    { user_id: client.id, title: 'Foto adicionada', message: 'Novas fotos da etapa de instalacao foram adicionadas.', type: 'info', read: false, project_id: project.id },
  ])
  console.log('  ✅ 3 notificacoes criadas')

  console.log('\n========================================')
  console.log('🎉 SEED CONCLUIDO COM SUCESSO!')
  console.log('========================================')
  console.log('\n📊 Dados de teste:')
  console.log(`  Admin:    ${ADMIN_EMAIL} / 2025!Adm`)
  console.log('  Executor: joao@teste.com / teste123')
  console.log('  Cliente:  erick@teste.com / teste123')
  console.log(`  Veiculo:  BMW X5 xDrive40i (ELT-2E25)`)
  console.log(`  Projeto:  ${project.id} (55%, in_progress)`)
  console.log('  Timeline: 9 etapas (4 completed, 1 in_progress, 4 pending)')
  console.log('  Linha:    Ultra Lite Armor / NIJ III-A')
  console.log('  Fotos:    8 fotos nas etapas concluidas\n')
}

async function main() {
  try {
    await cleanOldTestData()
    await seedTestData()
  } catch (error) {
    console.error('\n❌ ERRO:', error.message || error)
    process.exit(1)
  }
}

main()
