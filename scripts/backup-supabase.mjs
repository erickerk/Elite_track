#!/usr/bin/env node

/**
 * Script de backup automático do Supabase.
 * 
 * USO:
 *   node scripts/backup-supabase.mjs
 * 
 * AUTOMAÇÃO (cron no servidor ou GitHub Actions):
 *   0 3 * * * node /path/to/scripts/backup-supabase.mjs
 * 
 * PRÉ-REQUISITOS:
 *   - Variável SUPABASE_DB_URL no .env (connection string do Postgres)
 *   - pg_dump instalado (vem com PostgreSQL client)
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const BACKUP_DIR = join(process.cwd(), 'backups')
const MAX_BACKUPS = 7 // Manter últimos 7 dias
const DB_URL = process.env.SUPABASE_DB_URL

if (!DB_URL) {
  console.error('[Backup] SUPABASE_DB_URL não configurada no .env')
  console.log('[Backup] Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres')
  process.exit(1)
}

// Criar diretório de backups
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true })
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const filename = `elitetrack-backup-${timestamp}.sql`
const filepath = join(BACKUP_DIR, filename)

console.log(`[Backup] Iniciando backup: ${filename}`)

try {
  execSync(`pg_dump "${DB_URL}" --no-owner --no-privileges --file="${filepath}"`, {
    stdio: 'inherit',
    timeout: 120000, // 2 minutos
  })

  console.log(`[Backup] Backup salvo: ${filepath}`)

  // Limpar backups antigos
  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('elitetrack-backup-') && f.endsWith('.sql'))
    .sort()
    .reverse()

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS)
    for (const file of toDelete) {
      unlinkSync(join(BACKUP_DIR, file))
      console.log(`[Backup] Removido backup antigo: ${file}`)
    }
  }

  console.log(`[Backup] Concluído. ${Math.min(files.length, MAX_BACKUPS)} backups mantidos.`)
} catch (err) {
  console.error('[Backup] Erro ao executar pg_dump:', err.message)
  console.log('[Backup] Verifique se pg_dump está instalado e a SUPABASE_DB_URL está correta.')
  process.exit(1)
}
