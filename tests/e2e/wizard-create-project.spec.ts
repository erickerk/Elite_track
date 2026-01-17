import { test, expect } from '@playwright/test'

test.describe('Wizard Criar Projeto - Executor', () => {
  test.beforeEach(async ({ page }) => {
    // Login como executor
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'executor@elite.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/dashboard')
  })

  test('Deve abrir wizard ao clicar Novo Projeto', async ({ page }) => {
    // Clicar no botão Novo Projeto
    await page.click('button:has-text("Novo Projeto")')
    
    // Validar que wizard abriu
    await expect(page.locator('text=Novo Projeto')).toBeVisible()
    await expect(page.locator('text=Cliente')).toBeVisible()
    await expect(page.locator('text=Veículo')).toBeVisible()
    await expect(page.locator('text=Blindagem')).toBeVisible()
    await expect(page.locator('text=Revisão')).toBeVisible()
  })

  test('Deve validar campos obrigatórios na Etapa 1', async ({ page }) => {
    await page.click('button:has-text("Novo Projeto")')
    
    // Tentar avançar sem preencher
    await page.click('button:has-text("Próximo")')
    
    // Deve aparecer alerta
    await expect(page.locator('text=Preencha todos os campos obrigatórios')).toBeVisible()
  })

  test('Deve navegar entre etapas corretamente', async ({ page }) => {
    await page.click('button:has-text("Novo Projeto")')
    
    // Etapa 1: Preencher dados do cliente
    await page.fill('input[placeholder*="Nome"]', 'João Silva Teste')
    await page.fill('input[type="email"]', 'joao.teste@email.com')
    await page.fill('input[type="tel"]', '11999999999')
    await page.click('button:has-text("Próximo")')
    
    // Validar etapa 2
    await expect(page.locator('text=Dados do Veículo')).toBeVisible()
    
    // Preencher veículo
    await page.fill('input[placeholder*="BMW"]', 'BMW')
    await page.fill('input[placeholder*="X5"]', 'X5')
    await page.fill('input[placeholder*="2024"]', '2024')
    await page.fill('input[placeholder*="ABC"]', 'ABC1234')
    
    // Voltar
    await page.click('button:has-text("Voltar")')
    
    // Deve voltar para etapa 1
    await expect(page.locator('text=Dados do Cliente')).toBeVisible()
    await expect(page.locator('input[value="João Silva Teste"]')).toBeVisible()
  })

  test('Deve exibir revisão completa na Etapa 4', async ({ page }) => {
    await page.click('button:has-text("Novo Projeto")')
    
    // Etapa 1
    await page.fill('input[placeholder*="Nome"]', 'Maria Santos')
    await page.fill('input[type="email"]', 'maria@email.com')
    await page.fill('input[type="tel"]', '11988888888')
    await page.click('button:has-text("Próximo")')
    
    // Etapa 2
    await page.fill('input[placeholder*="BMW"]', 'Mercedes')
    await page.fill('input[placeholder*="X5"]', 'GLC')
    await page.fill('input[placeholder*="2024"]', '2023')
    await page.fill('input[placeholder*="ABC"]', 'XYZ9876')
    await page.click('button:has-text("Próximo")')
    
    // Etapa 3
    await page.selectOption('select', 'NIJ III-A')
    await page.click('button:has-text("Próximo")')
    
    // Etapa 4 - Revisar
    await expect(page.locator('text=Revisar Informações')).toBeVisible()
    await expect(page.locator('text=Maria Santos')).toBeVisible()
    await expect(page.locator('text=maria@email.com')).toBeVisible()
    await expect(page.locator('text=Mercedes GLC 2023')).toBeVisible()
    await expect(page.locator('text=XYZ9876')).toBeVisible()
    await expect(page.locator('text=NIJ III-A')).toBeVisible()
  })

  test('Deve ter botão Criar Projeto ativo na Etapa 4', async ({ page }) => {
    await page.click('button:has-text("Novo Projeto")')
    
    // Navegar até etapa 4
    // Etapa 1
    await page.fill('input[placeholder*="Nome"]', 'Cliente Teste')
    await page.fill('input[type="email"]', 'teste@email.com')
    await page.fill('input[type="tel"]', '11977777777')
    await page.click('button:has-text("Próximo")')
    
    // Etapa 2
    await page.fill('input[placeholder*="BMW"]', 'Audi')
    await page.fill('input[placeholder*="X5"]', 'Q5')
    await page.fill('input[placeholder*="2024"]', '2024')
    await page.fill('input[placeholder*="ABC"]', 'TEST123')
    await page.click('button:has-text("Próximo")')
    
    // Etapa 3
    await page.click('button:has-text("Próximo")')
    
    // Etapa 4
    const createButton = page.locator('button:has-text("Criar Projeto")')
    await expect(createButton).toBeVisible()
    await expect(createButton).toBeEnabled()
  })

  test('Deve fechar wizard ao clicar Cancelar', async ({ page }) => {
    await page.click('button:has-text("Novo Projeto")')
    
    // Clicar em Cancelar
    await page.click('button:has-text("Cancelar")')
    
    // Wizard deve fechar
    await expect(page.locator('text=Novo Projeto')).not.toBeVisible()
  })

  test('Progress bar deve destacar etapa atual', async ({ page }) => {
    await page.click('button:has-text("Novo Projeto")')
    
    // Etapa 1 - ícone User deve estar destacado
    const step1Icon = page.locator('[data-testid="step-1"]').or(page.locator('svg').nth(0))
    await expect(step1Icon).toHaveClass(/text-primary|bg-primary/)
    
    // Avançar para etapa 2
    await page.fill('input[placeholder*="Nome"]', 'Teste')
    await page.fill('input[type="email"]', 'teste@test.com')
    await page.fill('input[type="tel"]', '11999999999')
    await page.click('button:has-text("Próximo")')
    
    // Etapa 2 - ícone Car deve estar destacado
    const step2Icon = page.locator('[data-testid="step-2"]').or(page.locator('svg').nth(1))
    await expect(step2Icon).toHaveClass(/text-primary|bg-primary/)
  })
})

test.describe('Acessibilidade do Wizard', () => {
  test('Todos os inputs devem ter labels', async ({ page }) => {
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'executor@elite.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/dashboard')
    
    await page.click('button:has-text("Novo Projeto")')
    
    // Validar que inputs têm title ou aria-label
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').all()
    
    for (const input of inputs) {
      const hasTitle = await input.getAttribute('title')
      const hasAriaLabel = await input.getAttribute('aria-label')
      const hasPlaceholder = await input.getAttribute('placeholder')
      
      expect(hasTitle || hasAriaLabel || hasPlaceholder).toBeTruthy()
    }
  })

  test('Botões devem ter texto descritivo', async ({ page }) => {
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'executor@elite.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/dashboard')
    
    await page.click('button:has-text("Novo Projeto")')
    
    // Todos os botões devem ter texto
    const buttons = await page.locator('button').all()
    
    for (const button of buttons) {
      const text = await button.textContent()
      const hasTitle = await button.getAttribute('title')
      const hasAriaLabel = await button.getAttribute('aria-label')
      
      expect(text || hasTitle || hasAriaLabel).toBeTruthy()
    }
  })
})

test.describe('Responsividade do Wizard', () => {
  test('Deve ser fullscreen em mobile', async ({ page }) => {
    // Simular mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'executor@elite.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/dashboard')
    
    await page.click('button:has-text("Novo Projeto")')
    
    // Wizard deve ocupar tela inteira
    const wizardContainer = page.locator('div.fixed.inset-0')
    await expect(wizardContainer).toBeVisible()
  })

  test('Deve ter layout responsivo em desktop', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await page.goto('http://localhost:5174/login')
    await page.fill('input[type="email"]', 'executor@elite.com')
    await page.fill('input[type="password"]', 'senha123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL('**/dashboard')
    
    await page.click('button:has-text("Novo Projeto")')
    
    // Wizard deve ter max-width
    const wizardContent = page.locator('div.max-w-2xl')
    await expect(wizardContent).toBeVisible()
  })
})
