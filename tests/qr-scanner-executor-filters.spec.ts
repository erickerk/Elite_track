import { test, expect, type Page } from '@playwright/test';

/**
 * TESTES T1-T4 - Validação de correções P1, P2, P3
 * 
 * T1: Landing "Consulta pública → Scanear QR" abre scanner SEM login
 * T2: Scanner decode simula leitura e valida navegação
 * T3: Executor - card "Concluídos" toggle funciona (ativa/desativa)
 * T4: Mobile executor - drawer abre/fecha, sem overflow horizontal
 */

test.describe('T1-T4: QR Scanner e Filtros Executor', () => {
  
  // Helper para login
  async function loginAsExecutor(page: Page) {
    await page.goto('/login');
    await page.fill('#email', 'executor@elite.com');
    await page.fill('#password', 'executor123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  }

  test.describe('T1: Landing → Scanner QR Público (sem login)', () => {
    
    test('Botão "Consultar Histórico" abre modal na Landing', async ({ page }) => {
      await page.goto('/');
      
      // Clicar no botão de consulta pública
      const consultaBtn = page.locator('button:has-text("Consultar Histórico")').first();
      await expect(consultaBtn).toBeVisible();
      await consultaBtn.click();
      
      // Modal deve abrir
      await expect(page.getByText('Consultar Histórico').nth(1)).toBeVisible();
    });

    test('Botão "Escanear QR Code" navega para /scan SEM exigir login', async ({ page }) => {
      await page.goto('/');
      
      // Abrir modal de consulta
      await page.locator('button:has-text("Consultar Histórico")').first().click();
      await expect(page.getByText('Consultar Histórico').nth(1)).toBeVisible();
      
      // Clicar em "Escanear QR Code"
      const scanBtn = page.locator('button:has-text("Escanear QR Code")');
      await expect(scanBtn).toBeVisible();
      
      // Interceptar navegação - NÃO deve ir para /login
      const [response] = await Promise.all([
        page.waitForNavigation({ timeout: 5000 }),
        scanBtn.click()
      ]);
      
      // Deve estar em /scan, NÃO em /login
      const url = page.url();
      expect(url).toContain('/scan');
      expect(url).not.toContain('/login');
    });

    test('Página /scan carrega sem autenticação', async ({ page }) => {
      // Acesso direto à rota /scan (como se viesse da landing)
      await page.goto('/scan?mode=verify');
      
      // Deve mostrar a interface do scanner, não redirect para login
      await expect(page.locator('h1:has-text("Scanner QR")')).toBeVisible({ timeout: 5000 });
      
      // Deve ter o botão de abrir câmera
      await expect(page.locator('button:has-text("Abrir Câmera")')).toBeVisible();
    });
  });

  test.describe('T2: Scanner - Decode e Navegação', () => {
    
    test('Scanner tem fallback para upload de imagem', async ({ page }) => {
      await page.goto('/scan?mode=verify');
      
      // Botão de enviar imagem deve estar visível
      await expect(page.locator('button:has-text("Enviar da Galeria")')).toBeVisible();
      await expect(page.locator('button:has-text("Enviar imagem do QR Code")')).toBeVisible();
    });

    test('Busca manual por placa funciona e navega corretamente', async ({ page }) => {
      await page.goto('/scan?mode=verify');
      
      // Preencher campo manual
      const input = page.locator('input[placeholder*="ABC-1D23"]');
      await expect(input).toBeVisible();
      await input.fill('ABC-1234');
      
      // Clicar no botão de busca
      await page.locator('button[aria-label="Buscar"]').click();
      
      // Deve navegar para /qr/ABC-1234
      await page.waitForURL(/\/qr\/ABC-1234|\/verify\/ABC-1234/, { timeout: 5000 });
    });

    test('Rota /qr/:code redireciona para /verify/:code', async ({ page }) => {
      // Simular acesso via QR code
      await page.goto('/qr/test-project-123');
      
      // Deve redirecionar para /verify/test-project-123
      await page.waitForURL(/\/verify\/test-project-123/, { timeout: 5000 });
    });
  });

  test.describe('T3: Executor - Filtros com Toggle', () => {
    
    test.beforeEach(async ({ page }) => {
      await loginAsExecutor(page);
    });

    test('Card "Concluído" funciona como TOGGLE (clica 2x volta ao default)', async ({ page }) => {
      // Verificar estado inicial - filterStatus deve ser 'pending' por default
      const pendingCard = page.locator('button:has-text("Pendente")').first();
      await expect(pendingCard).toBeVisible();
      
      // Clicar no card "Concluído" 
      const completedCard = page.locator('button:has-text("Concluído")').first();
      await expect(completedCard).toBeVisible();
      await completedCard.click();
      
      // Deve ativar o modo histórico - verificar que o badge "Histórico" aparece
      await expect(page.locator('text=📋 Histórico')).toBeVisible({ timeout: 3000 });
      
      // Clicar novamente no card "Concluído" - deve desativar (TOGGLE)
      await completedCard.click();
      
      // Deve voltar ao estado default (sem o badge "Histórico")
      await expect(page.locator('text=📋 Histórico')).not.toBeVisible({ timeout: 3000 });
    });

    test('Botão "Limpar filtro" existe e funciona', async ({ page }) => {
      // Ativar filtro de concluídos
      const completedCard = page.locator('button:has-text("Concluído")').first();
      await completedCard.click();
      
      // Deve aparecer botão "Limpar" e badge "Histórico"
      const clearBtn = page.locator('button:has-text("Limpar")');
      await expect(clearBtn).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=📋 Histórico')).toBeVisible();
      
      // Clicar no botão Limpar
      await clearBtn.click();
      
      // Badge histórico deve sumir
      await expect(page.locator('text=📋 Histórico')).not.toBeVisible({ timeout: 3000 });
    });

    test('Filtros por status são sincronizados visualmente', async ({ page }) => {
      // Clicar em "Em Andamento"
      const inProgressBtn = page.locator('button:has-text("Andamento")').first();
      await inProgressBtn.click();
      
      // Deve ter borda amarela (classe border-yellow-400)
      await expect(inProgressBtn).toHaveClass(/border-yellow/);
      
      // Clicar em "Total" deve resetar
      const totalBtn = page.locator('button:has-text("Total")').first();
      await totalBtn.click();
      
      // Total deve ter borda primary
      await expect(totalBtn).toHaveClass(/border-primary/);
    });
  });

  test.describe('T4: Executor Mobile - Drawer e Layout', () => {
    
    test.beforeEach(async ({ page }) => {
      // Configurar viewport mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsExecutor(page);
    });

    test('Menu hamburger abre drawer no mobile', async ({ page }) => {
      // Procurar botão hamburger (menu) - usando aria-label exato
      const hamburger = page.locator('button[aria-label="Abrir menu"]');
      
      // Se não encontrar hamburger, o teste falha
      await expect(hamburger).toBeVisible({ timeout: 5000 });
      
      // Clicar no hamburger
      await hamburger.click();
      
      // Drawer deve aparecer - procurar pelo texto "EliteTrack" dentro do drawer
      await expect(page.locator('.fixed.inset-y-0.left-0.w-72')).toBeVisible({ timeout: 3000 });
    });

    test('Selecionar item no drawer fecha automaticamente', async ({ page }) => {
      // Abrir drawer
      const hamburger = page.locator('button[aria-label="Abrir menu"]');
      await hamburger.click();
      
      // Drawer deve estar visível
      const drawer = page.locator('.fixed.inset-y-0.left-0.w-72');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      
      // Clicar em um item do menu dentro do drawer (ex: Clientes)
      await drawer.locator('button:has-text("Clientes")').click();
      
      // Drawer deve fechar automaticamente (transform muda para -translate-x-full)
      await expect(drawer).not.toBeVisible({ timeout: 3000 });
    });

    test('Não há overflow horizontal no mobile', async ({ page }) => {
      // Verificar que não há scroll horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });

    test('Bottom navigation existe no mobile', async ({ page }) => {
      // Deve haver navegação inferior no mobile
      const bottomNav = page.locator('nav.fixed.bottom-0, nav[class*="bottom-0"]').first();
      await expect(bottomNav).toBeVisible();
    });
  });
});
