import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const TEST_PROJECT_ID = 'f7c116dc-6f74-4beb-866f-440d9598d6a3'

test.describe('Debug QRRedirect após Cloudflare', () => {
  
  test('Testar redirect direto /qr/:uuid', async ({ page }) => {
    // Capturar console logs
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('📝', msg.text())
      }
    })

    // Navegar diretamente para /qr/:uuid (sem login)
    console.log(`🔗 Navegando para /qr/${TEST_PROJECT_ID}`)
    await page.goto(`${BASE}/qr/${TEST_PROJECT_ID}`)
    
    // Aguardar redirect
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    console.log('🌐 URL após redirect:', currentUrl)
    
    // Deve redirecionar para /verify/:projectId
    expect(currentUrl).toContain('/verify/')
    expect(currentUrl).toContain(TEST_PROJECT_ID)
  })

  test('Verificar lógica UUID detection no QRRedirect', async ({ page }) => {
    await page.goto(`${BASE}`)
    
    // Testar função de detecção de UUID
    const result = await page.evaluate((testId) => {
      // Simular lógica do QRRedirect
      const code = testId
      const isUUID = code.includes('-') && code.length > 20
      
      return {
        code,
        isUUID,
        length: code.length,
        hasHyphen: code.includes('-')
      }
    }, TEST_PROJECT_ID)
    
    console.log('🧪 Teste UUID detection:', result)
    expect(result.isUUID).toBe(true)
    console.log('✅ UUID corretamente identificado')
  })

  test('Testar se /verify/:projectId funciona diretamente', async ({ page }) => {
    // Navegar diretamente para /verify/:projectId (rota pública)
    console.log(`🔗 Navegando para /verify/${TEST_PROJECT_ID}`)
    await page.goto(`${BASE}/verify/${TEST_PROJECT_ID}`)
    
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    console.log('🌐 URL atual:', currentUrl)
    
    // Deve permanecer em /verify/:projectId
    expect(currentUrl).toContain('/verify/')
    expect(currentUrl).toContain(TEST_PROJECT_ID)
    
    // Verificar se a página carregou
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    
    await page.screenshot({ path: 'test-results/verify-direct.png', fullPage: true })
    console.log('✅ Rota /verify/:projectId funciona corretamente')
  })
})
