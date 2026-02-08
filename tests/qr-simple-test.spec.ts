import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const TEST_PROJECT_ID = 'f7c116dc-6f74-4beb-866f-440d9598d6a3'
const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }

test.describe('QR Code - Teste Simples', () => {
  
  test('Navegar diretamente para /qr/:uuid (usuário logado)', async ({ page }) => {
    // Capturar console logs
    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      logs.push(text)
      if (text.includes('[QRRedirect]')) {
        console.log('🔍', text)
      }
    })

    // Login primeiro
    await page.goto(`${BASE}/login`)
    await page.getByRole('textbox', { name: 'Email' }).fill(CLIENT.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(CLIENT.password)
    await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    
    console.log('✅ Login realizado')

    // Navegar para /qr/:uuid
    console.log(`🔗 Navegando para /qr/${TEST_PROJECT_ID}`)
    await page.goto(`${BASE}/qr/${TEST_PROJECT_ID}`)
    
    // Aguardar navegação
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    console.log('🌐 URL final:', currentUrl)
    
    // Imprimir logs relevantes
    console.log('\n📝 Logs do QRRedirect:')
    logs.filter(log => log.includes('[QRRedirect]')).forEach(log => console.log('  ', log))
    
    await page.screenshot({ path: 'test-results/qr-simple-logged-in.png', fullPage: true })
    
    // Verificar se redirecionou corretamente
    if (!currentUrl.includes('/verify/')) {
      console.error('❌ ERRO: Não redirecionou para /verify/')
      console.error('   Esperado: /verify/' + TEST_PROJECT_ID)
      console.error('   Recebido:', currentUrl)
    }
    
    expect(currentUrl).toContain('/verify/')
    expect(currentUrl).toContain(TEST_PROJECT_ID)
  })

  test('Navegar diretamente para /qr/:uuid (sem login)', async ({ page }) => {
    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      logs.push(text)
      if (text.includes('[QRRedirect]')) {
        console.log('🔍', text)
      }
    })

    // Navegar SEM login
    console.log(`🔗 Navegando para /qr/${TEST_PROJECT_ID} (sem login)`)
    await page.goto(`${BASE}/qr/${TEST_PROJECT_ID}`)
    
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    console.log('🌐 URL final:', currentUrl)
    
    console.log('\n📝 Logs do QRRedirect:')
    logs.filter(log => log.includes('[QRRedirect]')).forEach(log => console.log('  ', log))
    
    await page.screenshot({ path: 'test-results/qr-simple-no-login.png', fullPage: true })
    
    expect(currentUrl).toContain('/verify/')
    expect(currentUrl).toContain(TEST_PROJECT_ID)
  })
})
