import { test, expect } from '@playwright/test'

test.describe('Relatórios com Nome Descritivo', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'admin@elite.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/admin')
  })

  test('Relatório de projetos deve ter nome descritivo', async ({ page }) => {
    // Ir para aba de projetos
    await page.click('button:has-text("Projetos")')
    
    // Capturar download
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar")')
    const download = await downloadPromise
    
    // Validar nome do arquivo
    const filename = await download.suggestedFilename()
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    expect(filename).toMatch(/elite_track_\w+_\d{4}-\d{2}-\d{2}\.csv/)
    expect(filename).toContain(`${year}-${month}-${day}`)
  })

  test('Relatório de leads deve ter nome descritivo', async ({ page }) => {
    // Ir para aba de leads
    await page.click('button:has-text("Leads")')
    
    // Capturar download
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar")')
    const download = await downloadPromise
    
    // Validar nome do arquivo
    const filename = await download.suggestedFilename()
    expect(filename).toMatch(/elite_track_leads_\d{4}-\d{2}-\d{2}\.csv/)
  })

  test('Console deve mostrar feedback de download', async ({ page }) => {
    // Escutar console logs
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text())
      }
    })
    
    await page.click('button:has-text("Projetos")')
    
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar")')
    await downloadPromise
    
    // Verificar se há log de feedback
    const hasDownloadLog = consoleLogs.some(log => 
      log.includes('Relatório baixado') || 
      log.includes('elite_track')
    )
    
    expect(hasDownloadLog).toBeTruthy()
  })

  test('Arquivo CSV deve ter encoding UTF-8 com BOM', async ({ page }) => {
    await page.click('button:has-text("Projetos")')
    
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar")')
    const download = await downloadPromise
    
    // Salvar arquivo
    const path = await download.path()
    expect(path).toBeTruthy()
    
    // Ler arquivo
    const fs = require('fs')
    const content = fs.readFileSync(path, 'utf-8')
    
    // Verificar BOM (Byte Order Mark)
    expect(content.charCodeAt(0)).toBe(0xFEFF)
  })
})

test.describe('Exportação de Dados', () => {
  test('CSV deve ter cabeçalhos corretos', async ({ page }) => {
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'admin@elite.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/admin')
    
    await page.click('button:has-text("Projetos")')
    
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar")')
    const download = await downloadPromise
    
    // Salvar e ler arquivo
    const path = await download.path()
    const fs = require('fs')
    const content = fs.readFileSync(path, 'utf-8')
    
    // Remover BOM
    const contentWithoutBOM = content.replace(/^\uFEFF/, '')
    const lines = contentWithoutBOM.split('\n')
    
    // Primeira linha deve ser cabeçalho
    expect(lines[0]).toBeTruthy()
    expect(lines[0].length).toBeGreaterThan(0)
  })

  test('Dados devem estar separados por ponto-e-vírgula', async ({ page }) => {
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'admin@elite.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/admin')
    
    await page.click('button:has-text("Projetos")')
    
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Exportar")')
    const download = await downloadPromise
    
    const path = await download.path()
    const fs = require('fs')
    const content = fs.readFileSync(path, 'utf-8')
    
    // Verificar separador
    expect(content).toContain(';')
  })
})
