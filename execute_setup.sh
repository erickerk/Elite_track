#!/bin/bash

# =====================================================
# ELITE TRACK - SETUP SUPABASE VIA CURL
# =====================================================

SUPABASE_URL="https://rlaxbloitiknjikrpbim.supabase.co"
SUPABASE_TOKEN="sbp_0b35ae25d90bc12bbcb42d8410eb587032c09140"

echo "🚀 Executando setup do Supabase..."
echo ""

# Ler o arquivo SQL
SQL_FILE="SUPABASE_SETUP_SIMPLES.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Arquivo $SQL_FILE não encontrado"
  exit 1
fi

SQL_CONTENT=$(cat "$SQL_FILE")

# Executar SQL via API REST
echo "📤 Enviando SQL para Supabase..."

curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_TOKEN}" \
  -H "apikey: ${SUPABASE_TOKEN}" \
  -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}" \
  -w "\n%{http_code}\n"

echo ""
echo "✅ Requisição enviada"
