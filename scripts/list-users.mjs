import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env', 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=')
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
})

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

const { data, error } = await supabase
  .from('users_elitetrack')
  .select('email, role, name, is_active')
  .eq('is_active', true)
  .order('role')

if (error) { console.log('ERROR:', error); process.exit(1) }
data.forEach(u => console.log(`${u.role.padEnd(12)} | ${u.email.padEnd(35)} | ${u.name}`))
