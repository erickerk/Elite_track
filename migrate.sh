#!/bin/bash

SUPABASE_URL="https://rlaxbloitiknjikrpbim.supabase.co"
SUPABASE_TOKEN="sbp_d92a1b647685c1228839c685c792f56871e1f438"

echo "🚀 Iniciando migração via API REST do Supabase..."
echo "URL: $SUPABASE_URL"
echo ""

# Função para executar comando SQL
execute_sql() {
  local sql="$1"
  local desc="$2"
  
  echo "[*] $desc"
  
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "Authorization: Bearer ${SUPABASE_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SUPABASE_TOKEN}" \
    -d "{\"query\": \"$sql\"}" \
    | grep -q "error" && echo "❌ Erro" || echo "✅ Sucesso"
}

# 1. Inserir Admin Master
execute_sql \
  "INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, vip_level, created_at, updated_at) VALUES ('admin-master-001', 'Junior Rodrigues', 'juniorrodrigues1011@gmail.com', '(11) 99999-9999', 'super_admin', 'Elite@2024#Admin!', true, 'platinum', NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'super_admin', is_active = true, updated_at = NOW();" \
  "Criando Admin Master"

# 2. Inserir Executor
execute_sql \
  "INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, created_at, updated_at) VALUES ('executor-prod-001', 'Executor Elite', 'executor@elite.com', '(11) 98888-8888', 'executor', 'executor123', true, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = true, updated_at = NOW();" \
  "Criando Executor"

# 3. Inserir Cliente Teste
execute_sql \
  "INSERT INTO users_elitetrack (id, name, email, phone, role, password_hash, is_active, created_at, updated_at) VALUES ('client-joao-001', 'João Teste', 'joao@teste.com', '(11) 97777-7777', 'client', 'Teste@2025', true, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = true, updated_at = NOW();" \
  "Criando Cliente Teste"

echo ""
echo "✅ Migração concluída!"
