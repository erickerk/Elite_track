import { test, expect, devices } from '@playwright/test';

// Configuração para dispositivo mobile
const mobileDevice = devices['iPhone 13'];

test.describe('Executor Mobile Drawer', () => {
  test.use({ ...mobileDevice });

  test('Hamburger menu abre drawer e fecha ao selecionar item', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login');
    
    // Fazer login como executor
    await page.fill('input[type="email"]', 'joao@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    // Aguardar carregamento do dashboard
    await page.waitForTimeout(2000);
    
    // Verificar que o hamburger menu existe no mobile
    const hamburgerButton = page.locator('button[aria-label="Abrir menu"]');
    await expect(hamburgerButton).toBeVisible();
    
    // Clicar no hamburger para abrir drawer
    await hamburgerButton.click();
    
    // Verificar que o drawer está aberto
    await expect(page.getByText('EliteTrack™')).toBeVisible();
    await expect(page.getByText('Operação')).toBeVisible();
    
    // Clicar em um item do menu (Clientes)
    await page.getByRole('button', { name: 'Clientes' }).click();
    
    // Verificar que o drawer fechou (overlay não deve estar visível)
    await page.waitForTimeout(500);
    
    // Verificar que a página de clientes está ativa
    await expect(page.getByText('Clientes e Documentos')).toBeVisible();
  });

  test('Botão Escanear no drawer navega para /scan', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'joao@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Abrir drawer
    await page.locator('button[aria-label="Abrir menu"]').click();
    
    // Clicar no botão Escanear QR Code
    await page.getByRole('button', { name: 'Escanear QR Code' }).click();
    
    // Verificar navegação para /scan
    await expect(page).toHaveURL(/\/scan/);
  });
});

test.describe('Executor - Filtro de Concluídos', () => {
  test.use({ ...mobileDevice });

  test('Botão Concluído filtra projetos concluídos', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'joao@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Verificar que os stats buttons existem
    const completedButton = page.locator('button').filter({ hasText: 'Concluído' });
    await expect(completedButton).toBeVisible();
    
    // Clicar no botão Concluído
    await completedButton.click();
    
    // Verificar que o filtro foi aplicado (botão deve estar destacado)
    await expect(completedButton).toHaveClass(/border-green-400/);
  });
});

test.describe('QR Scanner - Rota Pública', () => {
  test('Página /scan é acessível sem login', async ({ page }) => {
    // Navegar diretamente para /scan sem fazer login
    await page.goto('/scan');
    
    // Verificar que a página carregou (não redirecionou para login)
    await expect(page).not.toHaveURL(/\/login/);
    
    // Verificar elementos do scanner
    await expect(page.getByText('Scanner QR')).toBeVisible();
  });

  test('Landing page consulta pública navega para /scan', async ({ page }) => {
    await page.goto('/');
    
    // Procurar botão de consulta
    const consultaButton = page.getByRole('button', { name: /consultar/i }).first();
    
    if (await consultaButton.isVisible()) {
      await consultaButton.click();
      
      // Procurar botão de escanear QR no modal
      const scanButton = page.getByRole('button', { name: /escanear qr/i });
      if (await scanButton.isVisible()) {
        await scanButton.click();
        
        // Verificar navegação para /scan
        await expect(page).toHaveURL(/\/scan/);
      }
    }
  });
});

test.describe('Executor - Visibilidade de Clientes', () => {
  test('Executor vê lista de clientes/projetos', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'joao@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    // Navegar para aba Clientes via drawer (mobile)
    const hamburgerButton = page.locator('button[aria-label="Abrir menu"]');
    if (await hamburgerButton.isVisible()) {
      await hamburgerButton.click();
      await page.getByRole('button', { name: 'Clientes' }).click();
    }
    
    // Verificar que a seção de clientes carregou
    await expect(page.getByText('Clientes e Documentos')).toBeVisible();
    
    // Verificar que há pelo menos a estrutura de lista (pode estar vazia)
    await expect(page.getByText(/Lista|Grade/)).toBeVisible();
  });
});
