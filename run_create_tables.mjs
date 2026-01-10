import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rlaxbloitiknjikrpbim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8'
);

console.log('Creating tables in Supabase...\n');

// Test if tables exist
const { data: rescueTest, error: rescueError } = await supabase
  .from('rescue_requests')
  .select('id')
  .limit(1);

const { data: scheduleTest, error: scheduleError } = await supabase
  .from('schedules')
  .select('id')
  .limit(1);

console.log('rescue_requests:', rescueError ? 'NOT EXISTS - needs creation' : 'EXISTS');
console.log('schedules:', scheduleError ? 'NOT EXISTS - needs creation' : 'EXISTS');

console.log('\n========================================');
console.log('Para criar as tabelas, execute o SQL abaixo');
console.log('no Supabase Dashboard > SQL Editor:');
console.log('========================================\n');
console.log('Arquivo: supabase/migrations/008_rescue_and_schedules.sql');
