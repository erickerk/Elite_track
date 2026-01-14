#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM2MjQwMDAsImV4cCI6MTg2MTM5MjAwMH0.X-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function seedTestData() {
  console.log('🌱 Iniciando seed de dados de teste...\n')

  try {
    // 1. Criar usuário executor João
    console.log('📝 Criando executor João...')
    const { data: joaoUser, error: joaoError } = await supabase
      .from('users')
      .upsert({
        email: 'joao@teste.com',
        name: 'João Silva',
        role: 'executor',
        phone: '11999999001'
      }, { onConflict: 'email' })
      .select()
      .single()

    if (joaoError && joaoError.code !== '23505') throw joaoError
    console.log('✅ Executor João criado/atualizado')

    // 2. Criar cliente Erick
    console.log('\n📝 Criando cliente Erick...')
    const { data: erickUser, error: erickError } = await supabase
      .from('users')
      .upsert({
        email: 'erick@teste.com',
        name: 'Erick Kerkoski',
        role: 'client',
        phone: '11999999002'
      }, { onConflict: 'email' })
      .select()
      .single()

    if (erickError && erickError.code !== '23505') throw erickError
    console.log('✅ Cliente Erick criado/atualizado')

    // 3. Criar veículo do Erick
    console.log('\n📝 Criando veículo do Erick...')
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .upsert({
        plate: 'ABC-1D23',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        color: 'Preto',
        blinding_level: 'NIJ III-A'
      }, { onConflict: 'plate' })
      .select()
      .single()

    if (vehicleError && vehicleError.code !== '23505') throw vehicleError
    console.log('✅ Veículo criado/atualizado')

    // 4. Criar projeto vinculado ao João e Erick
    console.log('\n📝 Criando projeto...')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: erickUser?.id || (await supabase.from('users').select('id').eq('email', 'erick@teste.com').single()).data.id,
        vehicle_id: vehicle?.id || (await supabase.from('vehicles').select('id').eq('plate', 'ABC-1D23').single()).data.id,
        executor_id: joaoUser?.id || (await supabase.from('users').select('id').eq('email', 'joao@teste.com').single()).data.id,
        status: 'in_progress',
        progress: 65,
        start_date: '2025-01-01',
        estimated_delivery: '2025-02-15',
        qr_code: 'QR-ERICK-2025-001'
      })
      .select()
      .single()

    if (projectError) {
      // Se já existe, buscar e atualizar executor_id
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('qr_code', 'QR-ERICK-2025-001')
        .single()

      if (existing) {
        await supabase
          .from('projects')
          .update({
            executor_id: joaoUser?.id || (await supabase.from('users').select('id').eq('email', 'joao@teste.com').single()).data.id
          })
          .eq('id', existing.id)
        console.log('✅ Projeto existente atualizado com executor_id')
      }
    } else {
      console.log('✅ Projeto criado com sucesso')

      // 5. Criar timeline steps com fotos
      console.log('\n📝 Criando timeline...')
      const steps = [
        { title: 'Check-in', status: 'completed', sort_order: 0 },
        { title: 'Desmontagem', status: 'completed', sort_order: 1 },
        { title: 'Aplicação de Aramida', status: 'in_progress', sort_order: 2 },
        { title: 'Instalação de Vidros', status: 'pending', sort_order: 3 },
        { title: 'Acabamento', status: 'pending', sort_order: 4 },
      ]

      for (const step of steps) {
        const { data: stepData, error: stepError } = await supabase
          .from('timeline_steps')
          .insert({
            project_id: project.id,
            ...step,
            description: `Etapa: ${step.title}`
          })
          .select()
          .single()

        if (stepError) throw stepError

        // Adicionar 2 fotos para etapas concluídas
        if (step.status === 'completed') {
          await supabase.from('step_photos').insert([
            {
              step_id: stepData.id,
              photo_url: `https://placehold.co/600x400/1a1a1a/FFD700?text=${encodeURIComponent(step.title)}+1`,
              photo_type: 'before'
            },
            {
              step_id: stepData.id,
              photo_url: `https://placehold.co/600x400/1a1a1a/FFD700?text=${encodeURIComponent(step.title)}+2`,
              photo_type: 'after'
            }
          ])
        }
      }

      console.log('✅ Timeline criada com fotos')
    }

    console.log('\n🎉 Seed concluído com sucesso!')
    console.log('\n📊 Dados criados:')
    console.log('  - Executor: joao@teste.com / teste123')
    console.log('  - Cliente: erick@teste.com / teste123')
    console.log('  - Veículo: BMW X5 (ABC-1D23)')
    console.log('  - Projeto vinculado ao João com 5 etapas')
    console.log('\n💡 Próximos passos:')
    console.log('  1. Fazer login como joao@teste.com')
    console.log('  2. Verificar se cliente Erick aparece')
    console.log('  3. Testar filtro "Todos" vs "Meus"')
    console.log('  4. Verificar fotos na timeline\n')

  } catch (error) {
    console.error('\n❌ Erro ao criar dados:', error)
    process.exit(1)
  }
}

seedTestData()
