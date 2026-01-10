#!/usr/bin/env python3
"""
Script para executar migração SQL no Supabase via API REST
Usa o token de acesso pessoal do Supabase
"""

import requests
import json
import sys

# Configurações
SUPABASE_URL = "https://rlaxbloitiknjikrpbim.supabase.co"
SUPABASE_TOKEN = "sbp_d92a1b647685c1228839c685c792f56871e1f438"
MIGRATION_FILE = r"c:\Users\admin\Desktop\WindSurf\Elite_track-master\Elite_track\supabase\migrations\004_production_users_eliteshield.sql"

def read_migration_file():
    """Lê o arquivo de migração SQL"""
    try:
        with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {MIGRATION_FILE}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {e}")
        sys.exit(1)

def execute_migration(sql_content):
    """Executa a migração via API REST do Supabase"""
    
    # Endpoint da API REST para executar SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_TOKEN}",
        "Content-Type": "application/json",
        "apikey": SUPABASE_TOKEN,
    }
    
    # Dividir em comandos individuais (separados por ;)
    commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip()]
    
    print(f"📋 Total de comandos SQL: {len(commands)}")
    print("=" * 60)
    
    successful = 0
    failed = 0
    
    for i, command in enumerate(commands, 1):
        # Pular comentários
        if command.startswith('--'):
            continue
            
        print(f"\n[{i}/{len(commands)}] Executando comando...")
        print(f"Comando: {command[:80]}..." if len(command) > 80 else f"Comando: {command}")
        
        try:
            # Usar psql via curl para executar SQL
            # Alternativa: usar a API RPC do Supabase
            response = requests.post(
                url,
                headers=headers,
                json={"query": command},
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Sucesso")
                successful += 1
            else:
                print(f"⚠️ Status: {response.status_code}")
                print(f"Resposta: {response.text[:200]}")
                failed += 1
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro de conexão: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ Erro: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Resultado Final:")
    print(f"   ✅ Sucesso: {successful}")
    print(f"   ❌ Falhas: {failed}")
    print(f"   📋 Total: {len(commands)}")
    
    return failed == 0

def main():
    print("🚀 Iniciando migração do Supabase...")
    print(f"URL: {SUPABASE_URL}")
    print(f"Token: {SUPABASE_TOKEN[:20]}...")
    print()
    
    # Ler arquivo
    sql_content = read_migration_file()
    print(f"✅ Arquivo de migração carregado ({len(sql_content)} caracteres)")
    print()
    
    # Executar migração
    success = execute_migration(sql_content)
    
    if success:
        print("\n✅ Migração concluída com sucesso!")
        sys.exit(0)
    else:
        print("\n⚠️ Migração concluída com erros. Verifique os logs acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()
