import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }

test.describe('Debug QR Code pós-Cloudflare', () => {
  
  test('Verificar URL gerada no QR do projeto', async ({ page }) => {
    // Login como cliente Erick
    await page.goto(`${BASE}/login`)
    await page.getByRole('textbox', { name: 'Email' }).fill(CLIENT.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(CLIENT.password)
    await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // Navegar para QR Code
    await page.goto(`${BASE}/qrcode`)
    await page.waitForLoadState('networkidle')

    // Capturar a URL da imagem QR
    const qrImage = page.locator('img[alt="QR Code EliteTrace"]')
    await expect(qrImage).toBeVisible({ timeout: 10000 })
    
    const qrSrc = await qrImage.getAttribute('src')
    console.log('🔍 QR Image SRC:', qrSrc)

    // Decodificar a URL do QR
    if (qrSrc) {
      const dataMatch = qrSrc.match(/data=([^&]+)/)
      if (dataMatch) {
        const verifyUrl = decodeURIComponent(dataMatch[1])
        console.log('✅ Verify URL extraída:', verifyUrl)
        
        // Em DEV: localhost é esperado
        // Em PROD: deve ser app.eliteblindagens.com.br
        if (verifyUrl.includes('localhost')) {
          console.log('⚠️ DEV mode - URL usando localhost (esperado em desenvolvimento)')
          console.log('🔧 IMPORTANTE: Em produção Vercel, configure VITE_APP_URL=https://app.eliteblindagens.com.br')
        } else {
          expect(verifyUrl).toContain('https://app.eliteblindagens.com.br/verify/')
          console.log('✅ URL do QR aponta para produção Cloudflare')
        }
      }
    }

    await page.screenshot({ path: 'test-results/debug-qr-page.png', fullPage: true })
  })

  test('Verificar comportamento do QRScanner ao ler URL', async ({ page }) => {
    // Login como cliente
    await page.goto(`${BASE}/login`)
    await page.getByRole('textbox', { name: 'Email' }).fill(CLIENT.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(CLIENT.password)
    await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // Ir para scanner
    await page.goto(`${BASE}/scan`)
    await page.waitForLoadState('networkidle')

    // Verificar se input manual está presente
    const manualInput = page.locator('input[placeholder*="código"], input[placeholder*="QR"], input[type="text"]').first()
    
    if (await manualInput.isVisible()) {
      // Testar com URL Cloudflare
      const testUrl = 'https://app.eliteblindagens.com.br/verify/test-project-123'
      await manualInput.fill(testUrl)
      console.log('📝 URL de teste inserida:', testUrl)

      // Submit
      const submitBtn = page.locator('button:has-text("Buscar"), button:has-text("Scan"), button[type="submit"]').first()
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForTimeout(2000)
        console.log('✅ Submit do scanner executado')
      }
    }

    await page.screenshot({ path: 'test-results/debug-qr-scanner.png', fullPage: true })
  })

  test('Verificar VITE_APP_URL em runtime', async ({ page }) => {
    await page.goto(`${BASE}`)
    
    // Injetar script para verificar env vars
    const appUrl = await page.evaluate(() => {
      return (window as any).import?.meta?.env?.VITE_APP_URL || 
             (import.meta as any).env?.VITE_APP_URL ||
             'NOT_FOUND'
    })
    
    console.log('🔧 VITE_APP_URL em runtime:', appUrl)
    
    // CRÍTICO: deve ser https://app.eliteblindagens.com.br
    expect(appUrl).toBe('https://app.eliteblindagens.com.br')
  })

  test('Verificar getAppBaseUrl() retorna domínio correto', async ({ page }) => {
    await page.goto(`${BASE}`)
    
    const baseUrl = await page.evaluate(() => {
      // Simular a função getAppBaseUrl
      const viteUrl = (import.meta as any).env?.VITE_APP_URL
      if (viteUrl) return viteUrl
      return window.location.origin
    })
    
    console.log('🌐 getAppBaseUrl() retorna:', baseUrl)
    
    // Em dev: localhost
    // Em prod (Vercel): app.eliteblindagens.com.br
    if (baseUrl.includes('localhost')) {
      console.log('⚠️ Em ambiente DEV - OK usar localhost')
    } else {
      expect(baseUrl).toContain('app.eliteblindagens.com.br')
    }
  })
})
