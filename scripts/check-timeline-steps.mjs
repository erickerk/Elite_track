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

const { data, error } = await supabase
  .from('timeline_steps')
  .select('project_id, title, sort_order')
  .order('project_id')
  .order('sort_order')

if (error) {
  console.log('ERROR:', JSON.stringify(error))
  process.exit(1)
}

const grouped = {}
data.forEach(r => {
  if (!grouped[r.project_id]) grouped[r.project_id] = []
  grouped[r.project_id].push(`${r.sort_order}:${r.title}`)
})

Object.entries(grouped).forEach(([pid, steps]) => {
  console.log(`\n${pid.substring(0, 8)}...`)
  steps.forEach(s => console.log(`  ${s}`))
})

console.log(`\nTotal: ${Object.keys(grouped).length} projetos, ${data.length} steps`)
