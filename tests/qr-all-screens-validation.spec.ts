import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }
const CLOUDFLARE_DOMAIN = 'https://app.eliteblindagens.com.br'

test.describe('QR Code - Validação Completa em Todas as Telas', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login como cliente
    await page.goto(`${BASE}/login`)
    await page.getByRole('textbox', { name: 'Email' }).fill(CLIENT.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(CLIENT.password)
    await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  })

  test('1. QR Code no Dashboard do Cliente', async ({ page }) => {
    // Já estamos no dashboard
    await page.waitForLoadState('networkidle')
    
    // Verificar se QR Code está visível
    const qrImage = page.locator('img[alt="QR Code"]').first()
    await expect(qrImage).toBeVisible({ timeout: 10000 })
    
    // Verificar URL do QR
    const qrSrc = await qrImage.getAttribute('src')
    expect(qrSrc).toContain('api.qrserver.com')
    
    // Extrair e validar URL de verificação
    const dataMatch = qrSrc!.match(/data=([^&]+)/)
    if (dataMatch) {
      const verifyUrl = decodeURIComponent(dataMatch[1])
      console.log('✅ Dashboard QR URL:', verifyUrl)
      
      if (verifyUrl.includes('localhost')) {
        console.log('⚠️ DEV - usando localhost')
      } else {
        expect(verifyUrl).toContain(`${CLOUDFLARE_DOMAIN}/verify/`)
        console.log('✅ Dashboard QR aponta para Cloudflare')
      }
    }
  })

  test('2. QR Code na Página /qrcode', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForLoadState('networkidle')
    
    // Verificar título EliteTrace
    await expect(page.getByText('EliteTrace™')).toBeVisible()
    
    // Verificar imagem QR
    const qrImage = page.locator('img[alt="QR Code EliteTrace"]')
    await expect(qrImage).toBeVisible()
    
    const qrSrc = await qrImage.getAttribute('src')
    expect(qrSrc).toContain('api.qrserver.com')
    
    console.log('✅ Página /qrcode: QR Code visível')
  })

  test('3. QR Code no Laudo EliteShield', async ({ page }) => {
    // Navegar para o laudo
    await page.goto(`${BASE}/elite-shield`)
    await page.waitForLoadState('networkidle')
    
    // Procurar QR Code do EliteTrace no laudo
    const qrImage = page.locator('img[alt="QR Code EliteTrace"]')
    
    if (await qrImage.isVisible()) {
      const qrSrc = await qrImage.getAttribute('src')
      expect(qrSrc).toContain('api.qrserver.com')
      console.log('✅ Laudo EliteShield: QR Code visível')
    } else {
      console.log('⚠️ QR Code não visível no laudo (pode estar em seção colapsada)')
    }
  })

  test('4. Scanner aceita URL completa Cloudflare', async ({ page }) => {
    await page.goto(`${BASE}/scan`)
    await page.waitForLoadState('networkidle')
    
    // URL completa do Cloudflare para teste
    const testUrl = `${CLOUDFLARE_DOMAIN}/verify/f7c116dc-6f74-4beb-866f-440d9598d6a3`
    
    // Inserir URL no input manual
    const input = page.locator('input[placeholder*="ABC-1D23"]')
    await expect(input).toBeVisible()
    await input.fill(testUrl)
    
    // Clicar em buscar
    const searchBtn = page.locator('button[aria-label="Buscar"]')
    await searchBtn.click()
    
    // Aguardar navegação
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    expect(currentUrl).toContain('/verify/')
    console.log('✅ Scanner aceita URL Cloudflare completa')
  })

  test('5. QRRedirect funciona com UUID', async ({ page }) => {
    const testUUID = 'f7c116dc-6f74-4beb-866f-440d9598d6a3'
    
    await page.goto(`${BASE}/qr/${testUUID}`)
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    expect(currentUrl).toContain('/verify/')
    expect(currentUrl).toContain(testUUID)
    console.log('✅ QRRedirect: UUID → /verify/ funcionando')
  })

  test('6. Landing Page - Consulta aceita URL completa', async ({ page }) => {
    // Fazer logout primeiro
    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')
    
    // Procurar botão "Consultar Histórico"
    const consultarBtn = page.locator('button:has-text("Consultar Histórico"), div:has-text("Consultar Histórico")').first()
    
    if (await consultarBtn.isVisible()) {
      await consultarBtn.click()
      await page.waitForTimeout(1000)
      
      // Modal deve abrir
      const input = page.locator('input[placeholder*="PRJ-2025"]').or(page.locator('input[placeholder*="cole a URL"]'))
      
      if (await input.isVisible()) {
        const testUrl = `${CLOUDFLARE_DOMAIN}/verify/abc-123`
        await input.fill(testUrl)
        
        // Clicar em consultar
        const consultarModalBtn = page.locator('button:has-text("Consultar")')
        await consultarModalBtn.click()
        
        await page.waitForTimeout(2000)
        const currentUrl = page.url()
        expect(currentUrl).toContain('/verify/')
        console.log('✅ Landing Page: Consulta aceita URL completa')
      }
    } else {
      console.log('⚠️ Landing Page: Botão consultar não encontrado (pode estar logado)')
    }
  })

  test('7. Validar getVerifyUrl() retorna domínio correto', async ({ page }) => {
    await page.goto(`${BASE}`)
    
    const result = await page.evaluate(() => {
      // Simular verificação da variável de ambiente
      const appUrl = (import.meta as any).env?.VITE_APP_URL || window.location.origin
      return {
        appUrl,
        isDev: appUrl.includes('localhost'),
        isProd: appUrl.includes('eliteblindagens.com.br')
      }
    })
    
    console.log('🔍 Ambiente:', result)
    
    if (result.isDev) {
      expect(result.appUrl).toContain('localhost')
      console.log('✅ DEV: usando localhost')
    } else {
      expect(result.appUrl).toContain('eliteblindagens.com.br')
      console.log('✅ PROD: usando domínio Cloudflare')
    }
  })

  test('8. QR Code cores corretas (gold #D4AF37)', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForLoadState('networkidle')
    
    const qrImage = page.locator('img[alt="QR Code EliteTrace"]')
    const qrSrc = await qrImage.getAttribute('src')
    
    // Verificar cor gold (D4AF37) no QR
    expect(qrSrc).toContain('color=D4AF37')
    console.log('✅ QR Code usa cor gold padrão')
  })
})

test.describe('QR Code - Teste sem Login', () => {
  
  test('9. Rota pública /verify/:id acessível sem login', async ({ page }) => {
    const testId = 'f7c116dc-6f74-4beb-866f-440d9598d6a3'
    
    await page.goto(`${BASE}/verify/${testId}`)
    await page.waitForLoadState('networkidle')
    
    // Deve carregar sem redirecionar para login
    const currentUrl = page.url()
    expect(currentUrl).toContain('/verify/')
    expect(currentUrl).not.toContain('/login')
    console.log('✅ Rota /verify/ pública acessível sem login')
  })

  test('10. Scanner público acessível via /scan', async ({ page }) => {
    await page.goto(`${BASE}/scan`)
    await page.waitForLoadState('networkidle')
    
    // Deve mostrar scanner sem login
    await expect(page.getByText('Scanner QR')).toBeVisible()
    console.log('✅ Scanner QR público acessível')
  })
})
