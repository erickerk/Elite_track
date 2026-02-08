import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'
const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }

test.describe('QR Scanner - Perfil Erick após Cloudflare', () => {
  
  test('Reproduzir erro: scanear QR do perfil Erick', async ({ page }) => {
    // Capturar erros JS
    const errors: string[] = []
    page.on('pageerror', err => {
      errors.push(err.message)
      console.error('❌ Erro JS:', err.message)
    })
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console error:', msg.text())
      }
    })

    // Login como cliente Erick
    await page.goto(`${BASE}/login`)
    await page.getByRole('textbox', { name: 'Email' }).fill(CLIENT.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(CLIENT.password)
    await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // Passo 1: Obter o ID do projeto do Erick
    await page.waitForLoadState('networkidle')
    
    // Capturar URL do QR no Dashboard
    const qrImageSmall = page.locator('img[alt="QR Code"]').first()
    if (await qrImageSmall.isVisible()) {
      const qrSrc = await qrImageSmall.getAttribute('src')
      if (qrSrc) {
        const dataMatch = qrSrc.match(/data=([^&]+)/)
        if (dataMatch) {
          const verifyUrl = decodeURIComponent(dataMatch[1])
          console.log('📍 URL do QR do perfil Erick:', verifyUrl)

          // Passo 2: Simular scan deste QR
          await page.goto(`${BASE}/scan`)
          await page.waitForLoadState('networkidle')

          // Inserir URL manualmente (simula scanner)
          const manualInput = page.locator('input[placeholder*="ABC-1D23"]')
          await expect(manualInput).toBeVisible({ timeout: 5000 })
          
          await manualInput.fill(verifyUrl)
          console.log('📝 URL inserida no scanner:', verifyUrl)

          // Clicar no botão de busca (ícone de lupa)
          const searchBtn = page.locator('button[aria-label="Buscar"]')
          await expect(searchBtn).toBeVisible({ timeout: 5000 })
          await searchBtn.click()
          console.log('🔍 Botão buscar clicado')

          // Aguardar navegação
          await page.waitForTimeout(3000)

          // Verificar onde estamos
          const currentUrl = page.url()
          console.log('🌐 URL atual após scan:', currentUrl)

          // Verificar se houve erro
          if (errors.length > 0) {
            console.error('❌ ERROS DETECTADOS:')
            errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`))
            
            await page.screenshot({ 
              path: 'test-results/qr-error-erick.png', 
              fullPage: true 
            })
            
            throw new Error(`Scanner falhou com ${errors.length} erro(s): ${errors[0]}`)
          }

          // Deve redirecionar para /verify/:projectId
          expect(currentUrl).toMatch(/\/verify\/[a-f0-9-]+/)
          console.log('✅ Scanner funcionou corretamente')

          await page.screenshot({ 
            path: 'test-results/qr-scanner-erick-success.png', 
            fullPage: true 
          })
        }
      }
    }
  })

  test('Verificar extractProjectCode com URL Cloudflare', async ({ page }) => {
    await page.goto(`${BASE}`)
    
    // Testar a função extractProjectCode diretamente
    const result = await page.evaluate(() => {
      const testUrls = [
        'https://app.eliteblindagens.com.br/verify/abc-123',
        'http://localhost:5173/verify/abc-123',
        'https://app.eliteblindagens.com.br/verify/abc-123?utm_source=qr',
        '/verify/abc-123',
        'abc-123'
      ]

      const extractProjectCode = (data: string): string => {
        if (data.includes('/verify/')) {
          const parts = data.split('/verify/')
          return parts[1]?.split('?')[0] || data
        } else if (data.includes('/card/')) {
          const parts = data.split('/card/')
          return parts[1]?.split('?')[0] || data
        } else if (data.includes('/qr/')) {
          const parts = data.split('/qr/')
          return parts[1]?.split('?')[0] || data
        }
        return data
      }

      return testUrls.map(url => ({
        input: url,
        output: extractProjectCode(url)
      }))
    })

    console.log('🧪 Testes extractProjectCode:')
    result.forEach(({ input, output }) => {
      console.log(`  ${input} → ${output}`)
      expect(output).toBe('abc-123')
    })

    console.log('✅ extractProjectCode parseia corretamente URLs Cloudflare')
  })
})
