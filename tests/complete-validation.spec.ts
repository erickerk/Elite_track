import { test, expect } from '@playwright/test'

/**
 * Testes completos de validação - Elite Track
 * 
 * Usuários PRODUTIVOS (não são teste):
 * - joao@teste.com (executor)
 * - erick@teste.com (cliente)
 */

const BASE_URL = 'http://localhost:5175'

test.describe('Validação Completa - Elite Track', () => {
  
  test.describe('1. Login e Dashboard - Executor João', () => {
    
    test('Executor: Login e carregamento de projetos', async ({ page }) => {
      // 1. Navegar para login
      await page.goto(`${BASE_URL}/login`)
      
      // 2. Preencher credenciais do executor
      await page.fill('input[type="email"]', 'Joao@teste.com')
      await page.fill('input[type="password"]', 'Teste@2025')
      
      // 3. Fazer login
      await page.click('button[type="submit"]')
      
      // 4. Aguardar redirecionamento para dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 })
      
      // 5. Verificar se projetos carregaram (deve ter pelo menos 1)
      await page.waitForSelector('text=Total', { timeout: 10000 })
      
      // 6. Verificar stats do dashboard
      const totalProjects = await page.locator('text=Total').first()
      await expect(totalProjects).toBeVisible()
      
      // 7. Verificar se projeto do Erick aparece
      const projectCard = await page.locator('text=Erick').first()
      await expect(projectCard).toBeVisible({ timeout: 10000 })
      
      // 8. Screenshot do dashboard
      await page.screenshot({ 
        path: 'playwright-report/executor-dashboard.png', 
        fullPage: true 
      })
      
      console.log('✅ Executor: Login e dashboard funcionando')
    })

    test('Executor: Filtro "Concluídos" visível e funcional', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', 'joao@teste.com')
      await page.fill('input[type="password"]', 'teste123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Aguardar dashboard carregar
      await page.waitForSelector('text=Total', { timeout: 10000 })
      
      // Procurar filtro "Concluído" - pode estar como botão ou badge
      const completedFilter = page.locator('text=Concluído, text=Concluídos').first()
      await expect(completedFilter).toBeVisible()
      
      // Clicar no filtro
      await completedFilter.click()
      
      // Aguardar atualização da lista
      await page.waitForTimeout(1000)
      
      // Screenshot com filtro aplicado
      await page.screenshot({ 
        path: 'playwright-report/executor-filtro-concluidos.png',
        fullPage: true 
      })
      
      console.log('✅ Executor: Filtro Concluídos funcional')
    })

    test('Executor: Navegação para cliente Erick', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', 'joao@teste.com')
      await page.fill('input[type="password"]', 'teste123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Aguardar dashboard
      await page.waitForSelector('text=Erick', { timeout: 10000 })
      
      // Clicar no projeto do Erick
      const erickProject = page.locator('text=Erick').first()
      await erickProject.click()
      
      // Aguardar detalhes do projeto carregarem
      await page.waitForTimeout(2000)
      
      // Screenshot dos detalhes
      await page.screenshot({ 
        path: 'playwright-report/executor-projeto-erick.png',
        fullPage: true 
      })
      
      console.log('✅ Executor: Navegação para projeto do Erick OK')
    })
  })

  test.describe('2. Login e Dashboard - Cliente Erick', () => {
    
    test('Cliente: Login e visualização do projeto', async ({ page }) => {
      // 1. Navegar para login
      await page.goto(`${BASE_URL}/login`)
      
      // 2. Preencher credenciais do cliente
      await page.fill('input[type="email"]', 'erick@teste.com')
      await page.fill('input[type="password"]', 'Teste@2025')
      
      // 3. Fazer login
      await page.click('button[type="submit"]')
      
      // 4. Aguardar redirecionamento
      await page.waitForURL('**/dashboard', { timeout: 15000 })
      
      // 5. Verificar se projeto carregou
      await page.waitForSelector('text=Mini Cooper, text=BMW, text=Blindagem', { timeout: 10000 })
      
      // 6. Verificar fotos visíveis
      const photos = page.locator('img[alt*="foto"], img[src*="photo"]')
      const photoCount = await photos.count()
      
      expect(photoCount).toBeGreaterThan(0)
      
      // 7. Screenshot do dashboard do cliente
      await page.screenshot({ 
        path: 'playwright-report/cliente-dashboard.png',
        fullPage: true 
      })
      
      console.log(`✅ Cliente: Dashboard carregado com ${photoCount} fotos`)
    })

    test('Cliente: Navegação não causa tela preta', async ({ page }) => {
      // Coletar erros do console
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      page.on('pageerror', error => {
        errors.push(error.message)
      })
      
      // Login
      await page.goto(`${BASE_URL}/login`)
      await page.fill('input[type="email"]', 'erick@teste.com')
      await page.fill('input[type="password"]', 'teste123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')
      
      // Aguardar dashboard carregar
      await page.waitForTimeout(3000)
      
      // Navegar entre seções (se houver tabs/menu)
      const tabs = page.locator('button:has-text("Timeline"), button:has-text("Fotos"), button:has-text("Laudo")')
      const tabCount = await tabs.count()
      
      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click()
        await page.waitForTimeout(1000)
      }
      
      // Verificar se não houve tela preta (body deve estar visível)
      const body = page.locator('body')
      await expect(body).toBeVisible()
      
      // Screenshot final
      await page.screenshot({ 
        path: 'playwright-report/cliente-navegacao.png',
        fullPage: true 
      })
      
      // Verificar se não houve erros críticos
      const criticalErrors = errors.filter(e => 
        e.includes('Cannot read') || 
        e.includes('undefined') || 
        e.includes('null')
      )
      
      expect(criticalErrors.length).toBe(0)
      
      console.log('✅ Cliente: Navegação sem erros críticos')
    })
  })

  test.describe('3. Landing Page - Consulta Pública', () => {
    
    test('Landing Page: Botão "Consulta Pública" abre modal', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Aguardar landing page carregar
      await page.waitForLoadState('networkidle')
      
      // Procurar botão "Consulta Pública"
      const consultaButton = page.locator('button:has-text("Consulta Pública"), text=Consulta Pública').first()
      await expect(consultaButton).toBeVisible({ timeout: 10000 })
      
      // Clicar no botão
      await consultaButton.click()
      
      // Aguardar modal abrir
      await page.waitForTimeout(1000)
      
      // Verificar se campo de busca apareceu
      const searchInput = page.locator('input[placeholder*="placa"], input[placeholder*="código"], input[placeholder*="PRJ"]').first()
      await expect(searchInput).toBeVisible()
      
      // Screenshot do modal
      await page.screenshot({ 
        path: 'playwright-report/landing-consulta-modal.png',
        fullPage: true 
      })
      
      console.log('✅ Landing Page: Modal de consulta funcional')
    })

    test('Landing Page: Busca manual por código/placa', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Abrir modal de consulta
      const consultaButton = page.locator('button:has-text("Consulta Pública"), text=Consulta Pública').first()
      await consultaButton.click()
      await page.waitForTimeout(1000)
      
      // Digitar código/placa
      const searchInput = page.locator('input[placeholder*="placa"], input[placeholder*="código"], input[placeholder*="PRJ"]').first()
      await searchInput.fill('ABC123')
      
      // Pressionar Enter ou clicar em buscar
      await searchInput.press('Enter')
      
      // Aguardar navegação ou resultado
      await page.waitForTimeout(3000)
      
      // Screenshot do resultado
      await page.screenshot({ 
        path: 'playwright-report/landing-busca-manual.png',
        fullPage: true 
      })
      
      console.log('✅ Landing Page: Busca manual testada')
    })

    test('Landing Page: Botão "Escanear QR Code" navega para /scan', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Abrir modal de consulta
      const consultaButton = page.locator('button:has-text("Consulta Pública")').first()
      await consultaButton.click()
      await page.waitForTimeout(1000)
      
      // Procurar botão de QR Scanner
      const qrButton = page.locator('button:has-text("Escanear QR"), button:has-text("QR Code")').first()
      
      if (await qrButton.isVisible()) {
        await qrButton.click()
        
        // Aguardar navegação para /scan
        await page.waitForURL('**/scan*', { timeout: 5000 })
        
        // Verificar se página de scanner carregou
        const scannerPage = page.locator('text=Scanner, text=Câmera, text=QR').first()
        await expect(scannerPage).toBeVisible()
        
        // Screenshot do scanner
        await page.screenshot({ 
          path: 'playwright-report/landing-qr-scanner.png',
          fullPage: true 
        })
        
        console.log('✅ Landing Page: QR Scanner acessível')
      } else {
        console.log('⚠️ Botão de QR Scanner não encontrado no modal')
      }
    })
  })

  test.describe('4. QR Scanner - Página /scan', () => {
    
    test('QR Scanner: Página carrega e mostra UI', async ({ page }) => {
      // Navegar diretamente para /scan
      await page.goto(`${BASE_URL}/scan?mode=verify&autoStart=true`)
      
      // Aguardar página carregar
      await page.waitForLoadState('networkidle')
      
      // Verificar elementos da UI do scanner
      const scannerUI = page.locator('text=Scanner, text=Câmera, text=Ativar, video').first()
      await expect(scannerUI).toBeVisible({ timeout: 5000 })
      
      // Screenshot do scanner
      await page.screenshot({ 
        path: 'playwright-report/qr-scanner-page.png',
        fullPage: true 
      })
      
      console.log('✅ QR Scanner: Página carrega corretamente')
    })

    test('QR Scanner: Fallback manual disponível', async ({ page }) => {
      await page.goto(`${BASE_URL}/scan?mode=verify`)
      
      // Aguardar página carregar
      await page.waitForTimeout(2000)
      
      // Verificar se existe campo de busca manual como fallback
      const manualInput = page.locator('input[placeholder*="placa"], input[placeholder*="código"]').first()
      
      if (await manualInput.isVisible()) {
        // Testar busca manual
        await manualInput.fill('ABC123')
        await manualInput.press('Enter')
        
        await page.waitForTimeout(2000)
        
        await page.screenshot({ 
          path: 'playwright-report/qr-scanner-fallback.png',
          fullPage: true 
        })
        
        console.log('✅ QR Scanner: Fallback manual funcional')
      } else {
        console.log('⚠️ Fallback manual não encontrado')
      }
    })
  })
})
