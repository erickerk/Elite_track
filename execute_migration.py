#!/usr/bin/env python3
"""
Script para executar migração SQL diretamente no Supabase
Usa a API REST do Supabase para executar SQL
"""

import requests
import json
import sys
from pathlib import Path

# Configuração do Supabase
SUPABASE_URL = "https://rlaxbloitiknjikrpbim.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibmxvaXRpa25qaWtycGJpbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAzNjI0MDAwLCJleHAiOjE4NjEzOTIwMDB9.X-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_-qN_"

# SQL da migração
MIGRATION_SQL = """
-- Adicionar coluna executor_id para rastrear qual executor está responsável pelo projeto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para consultas por executor
CREATE INDEX IF NOT EXISTS idx_projects_executor_id ON projects(executor_id);

-- Comentário explicativo
COMMENT ON COLUMN projects.executor_id IS 'ID do executor atualmente responsável pelo projeto. Permite filtrar "Meus" projetos vs "Todos"';
""".strip()

def print_header():
    print("\n" + "="*70)
    print("🚀 EXECUTAR MIGRAÇÃO SQL - EXECUTOR_ID")
    print("="*70 + "\n")

def print_sql():
    print("📝 SQL a executar:")
    print("-"*70)
    print(MIGRATION_SQL)
    print("-"*70 + "\n")

def execute_migration():
    """Tenta executar a migração via API REST do Supabase"""
    print("⏳ Tentando executar via API REST do Supabase...")
    
    try:
        # Endpoint para executar SQL (requer função RPC ou acesso direto)
        # Nota: O Supabase não expõe um endpoint direto para SQL via API REST
        # Precisamos usar a função RPC se existir, ou o SQL Editor
        
        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY
        }
        
        # Tentar via RPC (se existir função exec_sql)
        payload = {
            "sql": MIGRATION_SQL
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print("✅ Migração executada com sucesso via API!")
            return True
        else:
            print(f"⚠️  API retornou status {response.status_code}")
            print(f"Resposta: {response.text}\n")
            return False
            
    except Exception as e:
        print(f"⚠️  Erro ao conectar à API: {e}\n")
        return False

def print_manual_instructions():
    """Exibe instruções para execução manual"""
    print("📍 EXECUÇÃO MANUAL NO SUPABASE SQL EDITOR")
    print("="*70)
    print("\n1. Acesse: https://app.supabase.com/project/rlaxbloitiknjikrpbim/sql/new")
    print("\n2. Cole o SQL abaixo no editor:")
    print("-"*70)
    print(MIGRATION_SQL)
    print("-"*70)
    print("\n3. Clique em 'Run' (ou Ctrl+Enter)")
    print("\n4. Aguarde a confirmação de sucesso")
    print("\n" + "="*70)
    print("✅ Após executar, o sistema estará pronto para usar!\n")

def verify_migration():
    """Verifica se a migração foi aplicada"""
    print("\n📊 VERIFICAÇÃO (execute no SQL Editor após a migração):")
    print("-"*70)
    print("""
-- Verificar coluna
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'executor_id';

-- Verificar índice
SELECT indexname FROM pg_indexes 
WHERE tablename = 'projects' AND indexname = 'idx_projects_executor_id';
    """.strip())
    print("-"*70 + "\n")

def main():
    print_header()
    print_sql()
    
    # Tentar execução automática
    success = execute_migration()
    
    if not success:
        # Se falhar, mostrar instruções manuais
        print_manual_instructions()
    
    print("\n🎯 PRÓXIMOS PASSOS:")
    print("  1. Executar a migração SQL (automática ou manual)")
    print("  2. Reiniciar o servidor: npm run dev")
    print("  3. Fazer login como executor: joao@teste.com / teste123")
    print("  4. Testar filtro 'Meus' vs 'Todos'")
    print("  5. Testar botão 'Tornar Meu'\n")
    
    verify_migration()

if __name__ == "__main__":
    main()
