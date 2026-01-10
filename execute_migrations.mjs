#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler token do .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const tokenMatch = envContent.match(/SUPABASE_TOKEN=(.+)/);
const token = tokenMatch ? tokenMatch[1].trim() : '';

if (!token) {
  console.error('❌ ERRO: SUPABASE_TOKEN não encontrado no .env');
  process.exit(1);
}

const SUPABASE_URL = 'https://rlaxbloitiknjikrpbim.supabase.co';

console.log('🔐 Usando token:', token.substring(0, 20) + '...');
console.log('📍 Supabase URL:', SUPABASE_URL);
console.log('');

// Criar cliente com token de admin
const supabase = createClient(SUPABASE_URL, token, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// SQL para criar as tabelas
const createRescueTableSQL = `
CREATE TABLE IF NOT EXISTS rescue_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  vehicle TEXT NOT NULL,
  vehicle_plate TEXT,
  rescue_type TEXT NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'high',
  assigned_to TEXT,
  dispatcher_notes TEXT,
  eta_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rescue_status ON rescue_requests(status);
CREATE INDEX IF NOT EXISTS idx_rescue_priority ON rescue_requests(priority);
CREATE INDEX IF NOT EXISTS idx_rescue_created ON rescue_requests(created_at);

ALTER TABLE rescue_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can create rescue requests"
  ON rescue_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can view rescue requests"
  ON rescue_requests FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can update rescue requests"
  ON rescue_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);
`;

const createScheduleTableSQL = `
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  vehicle TEXT NOT NULL,
  type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_project ON schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can manage schedules"
  ON schedules FOR ALL
  USING (true)
  WITH CHECK (true);
`;

const createTriggerSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rescue_requests_updated_at ON rescue_requests;
CREATE TRIGGER rescue_requests_updated_at
  BEFORE UPDATE ON rescue_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS schedules_updated_at ON schedules;
CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function executeMigrations() {
  try {
    console.log('📋 Executando migrações...\n');

    // 1. Criar tabela rescue_requests
    console.log('1️⃣  Criando tabela rescue_requests...');
    try {
      const result1 = await supabase.rpc('exec_sql', {
        query: createRescueTableSQL,
      });
      if (result1.error) {
        console.log('   ⚠️  Resposta:', result1.error.message);
      } else {
        console.log('   ✅ Sucesso!');
      }
    } catch (e) {
      console.log('   ⚠️  Erro:', e.message);
    }

    // 2. Criar tabela schedules
    console.log('\n2️⃣  Criando tabela schedules...');
    try {
      const result2 = await supabase.rpc('exec_sql', {
        query: createScheduleTableSQL,
      });
      if (result2.error) {
        console.log('   ⚠️  Resposta:', result2.error.message);
      } else {
        console.log('   ✅ Sucesso!');
      }
    } catch (e) {
      console.log('   ⚠️  Erro:', e.message);
    }

    // 3. Criar triggers
    console.log('\n3️⃣  Criando triggers para updated_at...');
    try {
      const result3 = await supabase.rpc('exec_sql', {
        query: createTriggerSQL,
      });
      if (result3.error) {
        console.log('   ⚠️  Resposta:', result3.error.message);
      } else {
        console.log('   ✅ Sucesso!');
      }
    } catch (e) {
      console.log('   ⚠️  Erro:', e.message);
    }

    // 4. Verificar se as tabelas foram criadas
    console.log('\n4️⃣  Verificando tabelas criadas...');
    
    const { data: rescueData, error: rescueCheckError } = await supabase
      .from('rescue_requests')
      .select('id')
      .limit(1);

    const { data: scheduleData, error: scheduleCheckError } = await supabase
      .from('schedules')
      .select('id')
      .limit(1);

    console.log('   rescue_requests:', rescueCheckError ? '❌ ERRO: ' + rescueCheckError.message : '✅ OK');
    console.log('   schedules:', scheduleCheckError ? '❌ ERRO: ' + scheduleCheckError.message : '✅ OK');

    console.log('\n' + '='.repeat(50));
    if (!rescueCheckError && !scheduleCheckError) {
      console.log('✅ TODAS AS TABELAS CRIADAS COM SUCESSO!');
      console.log('='.repeat(50));
      process.exit(0);
    } else {
      console.log('⚠️  ALGUMAS TABELAS PODEM NÃO TER SIDO CRIADAS');
      console.log('='.repeat(50));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

executeMigrations();
