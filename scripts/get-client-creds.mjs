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
  .select('email, password_hash, role')
  .eq('role', 'client')
  .eq('is_active', true)
  .limit(1)

if (error) { console.log('ERROR:', error); process.exit(1) }
data.forEach(u => console.log(`Email: ${u.email} | Pass: ${u.password_hash}`))
