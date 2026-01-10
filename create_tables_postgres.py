#!/usr/bin/env python3
"""
Script para criar tabelas no Supabase usando conexão PostgreSQL direta
"""

import os
import sys
from pathlib import Path

# Ler token do .env
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('SUPABASE_TOKEN='):
                token = line.split('=')[1].strip()
                break

if not token:
    print('❌ ERRO: SUPABASE_TOKEN não encontrado no .env')
    sys.exit(1)

print(f'🔐 Token: {token[:20]}...')

# Configurações do Supabase PostgreSQL
SUPABASE_HOST = 'db.rlaxbloitiknjikrpbim.supabase.co'
SUPABASE_DB = 'postgres'
SUPABASE_USER = 'postgres'
SUPABASE_PORT = 5432

# Ler SQL
sql_path = Path(__file__).parent / 'create_tables_fixed.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Dividir em comandos
commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip() and not cmd.strip().startswith('--')]

print(f'📋 Executando {len(commands)} comandos SQL...\n')

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print('❌ psycopg2 não instalado. Instalando...')
    os.system('pip install psycopg2-binary')
    import psycopg2
    from psycopg2 import sql

try:
    # Conectar ao banco de dados
    print('🔗 Conectando ao PostgreSQL...')
    conn = psycopg2.connect(
        host=SUPABASE_HOST,
        database=SUPABASE_DB,
        user=SUPABASE_USER,
        password=token,
        port=SUPABASE_PORT,
        sslmode='require'
    )
    
    cursor = conn.cursor()
    print('✅ Conectado!\n')
    
    # Executar comandos
    success_count = 0
    error_count = 0
    
    for i, command in enumerate(commands, 1):
        short_cmd = command.strip()[:50].replace('\n', ' ') + '...'
        print(f'[{i}/{len(commands)}] {short_cmd}', end=' ')
        
        try:
            cursor.execute(command)
            conn.commit()
            print('✅')
            success_count += 1
        except Exception as e:
            print('❌')
            print(f'         Erro: {str(e)[:80]}')
            error_count += 1
            conn.rollback()
    
    cursor.close()
    conn.close()
    
    print('\n' + '='*60)
    print(f'✅ Sucesso: {success_count}/{len(commands)}')
    print(f'❌ Erros: {error_count}/{len(commands)}')
    print('='*60)
    
    if error_count == 0:
        print('\n✅ TODAS AS TABELAS CRIADAS COM SUCESSO!')
        sys.exit(0)
    else:
        print('\n⚠️  Algumas operações falharam')
        sys.exit(1)
        
except Exception as e:
    print(f'\n❌ ERRO DE CONEXÃO: {e}')
    print('\nTente executar manualmente no Supabase Dashboard:')
    print('1. Abra: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql')
    print('2. Cole o conteúdo de create_tables_fixed.sql')
    print('3. Clique em Run')
    sys.exit(1)
