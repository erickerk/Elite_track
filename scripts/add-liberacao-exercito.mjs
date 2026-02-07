import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Parse .env manually
const envContent = readFileSync('.env', 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Migração: Adicionar "Liberação do Exército" antes de "Entrega" em todos os projetos
async function migrate() {
  console.log('=== Migração: Adicionar "Liberação do Exército" ===\n')

  // 1. Buscar todos os projetos
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('id')

  if (projError) {
    console.error('Erro ao buscar projetos:', projError)
    process.exit(1)
  }

  console.log(`Encontrados ${projects.length} projetos\n`)

  for (const project of projects) {
    const pid = project.id
    console.log(`Projeto: ${pid.substring(0, 8)}...`)

    // 2. Verificar se já tem "Liberação do Exército"
    const { data: existing } = await supabase
      .from('timeline_steps')
      .select('id, title')
      .eq('project_id', pid)
      .eq('title', 'Liberação do Exército')

    if (existing && existing.length > 0) {
      console.log('  ✅ Já tem "Liberação do Exército" — pulando\n')
      continue
    }

    // 3. Buscar step "Entrega" para saber o sort_order
    const { data: entregaStep } = await supabase
      .from('timeline_steps')
      .select('id, sort_order')
      .eq('project_id', pid)
      .eq('title', 'Entrega')
      .single()

    if (!entregaStep) {
      console.log('  ⚠️ Não encontrou step "Entrega" — pulando\n')
      continue
    }

    const entregaSortOrder = entregaStep.sort_order
    const newSortOrder = entregaSortOrder // Liberação fica no lugar da Entrega

    // 4. Incrementar sort_order da "Entrega" (e qualquer step >= entregaSortOrder)
    const { error: updateError } = await supabase
      .from('timeline_steps')
      .update({ sort_order: entregaSortOrder + 1 })
      .eq('id', entregaStep.id)

    if (updateError) {
      console.error('  ❌ Erro ao atualizar sort_order da Entrega:', updateError)
      continue
    }

    // 5. Inserir "Liberação do Exército"
    const { error: insertError } = await supabase
      .from('timeline_steps')
      .insert({
        project_id: pid,
        title: 'Liberação do Exército',
        description: 'Vistoria e liberação final pelo Exército Brasileiro',
        status: 'pending',
        sort_order: newSortOrder,
      })

    if (insertError) {
      console.error('  ❌ Erro ao inserir "Liberação do Exército":', insertError)
      continue
    }

    console.log(`  ✅ Inserido "Liberação do Exército" (sort_order=${newSortOrder}), Entrega → ${entregaSortOrder + 1}\n`)
  }

  // 6. Verificar resultado
  console.log('\n=== Verificação final ===\n')
  const { data: allSteps } = await supabase
    .from('timeline_steps')
    .select('project_id, title, sort_order')
    .order('project_id')
    .order('sort_order')

  const grouped = {}
  allSteps.forEach(r => {
    if (!grouped[r.project_id]) grouped[r.project_id] = []
    grouped[r.project_id].push(`${r.sort_order}:${r.title}`)
  })

  Object.entries(grouped).forEach(([pid, steps]) => {
    console.log(`${pid.substring(0, 8)}...`)
    steps.forEach(s => console.log(`  ${s}`))
    console.log()
  })

  console.log(`Total: ${Object.keys(grouped).length} projetos, ${allSteps.length} steps`)
}

migrate().catch(console.error)
