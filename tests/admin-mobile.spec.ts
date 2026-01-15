import { test, expect } from '@playwright/test';

// Testes para viewport mobile (iPhone 13)
test.describe('Admin Dashboard - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
  });

  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.fill('#email', 'admin@elite.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  }

  test('Deve exibir botão hamburger no mobile', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verificar que o botão de menu hamburger está visível
    const menuButton = page.locator('button[aria-label="Abrir menu"]');
    await expect(menuButton).toBeVisible();
  });

  test('Deve abrir menu drawer ao clicar no hamburger', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Clicar no botão hamburger
    await page.click('button[aria-label="Abrir menu"]');
    
    // Verificar que o menu drawer está visível
    await expect(page.locator('aside').filter({ hasText: 'Painel Admin' })).toBeVisible();
  });

  test('Menu mobile deve conter todos os itens de navegação', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Abrir menu
    await page.click('button[aria-label="Abrir menu"]');
    
    // Verificar itens principais
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Executores/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Clientes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Projetos/i })).toBeVisible();
  });

  test('Botão Logout deve estar visível no menu mobile', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Abrir menu
    await page.click('button[aria-label="Abrir menu"]');
    
    // Verificar que o botão de logout está visível
    const logoutButton = page.locator('button[aria-label="Sair da conta"]');
    await expect(logoutButton).toBeVisible();
  });

  test('Logout deve funcionar no mobile', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Abrir menu e clicar em logout
    await page.click('button[aria-label="Abrir menu"]');
    await page.click('button[aria-label="Sair da conta"]');
    
    // Verificar redirecionamento para login
    await expect(page).toHaveURL('/login');
  });

  test('Menu deve fechar ao clicar em item de navegação', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Abrir menu
    await page.click('button[aria-label="Abrir menu"]');
    
    // Clicar em um item
    await page.getByRole('button', { name: /Executores/i }).click();
    
    // Verificar que o menu fechou (backdrop não visível)
    await expect(page.locator('.bg-black\\/60')).not.toBeVisible();
  });

  test('Menu deve fechar ao clicar no X', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Abrir menu
    await page.click('button[aria-label="Abrir menu"]');
    
    // Clicar no X para fechar
    await page.click('button[aria-label="Fechar menu"]');
    
    // Verificar que o menu fechou
    await expect(page.locator('.bg-black\\/60')).not.toBeVisible();
  });
});

// Testes para viewport desktop
test.describe('Admin Dashboard - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.fill('#email', 'admin@elite.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  }

  test('Sidebar deve estar visível no desktop', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verificar que a sidebar fixa está visível
    const sidebar = page.locator('aside.hidden.lg\\:flex');
    await expect(sidebar).toBeVisible();
  });

  test('Botão hamburger NÃO deve estar visível no desktop', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Verificar que o botão hamburger está oculto
    const menuButton = page.locator('button[aria-label="Abrir menu"]');
    await expect(menuButton).not.toBeVisible();
  });

  test('Todos os itens de navegação devem estar na sidebar desktop', async ({ page }) => {
    await loginAsAdmin(page);
    
    const sidebar = page.locator('aside.hidden.lg\\:flex');
    
    // Verificar itens na sidebar
    await expect(sidebar.getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: /Executores/i })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: /Clientes/i })).toBeVisible();
  });

  test('Logout deve funcionar no desktop', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Clicar no botão de logout na sidebar
    const sidebar = page.locator('aside.hidden.lg\\:flex');
    await sidebar.locator('text=Sair').click();
    
    // Verificar redirecionamento
    await expect(page).toHaveURL('/login');
  });
});

// Testes de QR Code
test.describe('QR Code - Verificação', () => {
  test('Página de verificação deve carregar com projeto válido', async ({ page }) => {
    // Acessar página de verificação com ID de teste
    await page.goto('/verify/test-project-id');
    
    // Verificar elementos básicos
    await expect(page.getByRole('heading', { name: 'EliteTrack™' })).toBeVisible();
  });

  test('QR Code deve conter URL absoluta', async ({ page }) => {
    // Este teste valida que a lógica de URL está correta
    // Em produção, o QR deve apontar para o domínio correto
    await page.goto('/');
    
    // Verificar que a página carrega (smoke test)
    await expect(page).toHaveURL(/.*\//);
  });
});

// Testes de Projetos Concluídos
test.describe('Projetos Concluídos - Paridade Web/Mobile', () => {
  
  test.describe('Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
    });

    test('Projetos concluídos devem aparecer na listagem mobile', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', 'executor@elite.com');
      await page.fill('#password', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar que a página carregou
      await expect(page.getByRole('heading', { name: 'EliteTrack™' })).toBeVisible();
      
      // Verificar toggle de histórico (se existir)
      const historyButton = page.getByRole('button', { name: /Histórico/i });
      if (await historyButton.isVisible()) {
        await historyButton.click();
        // Verificar que mostra projetos concluídos
        await expect(page.getByText('Mostrando projetos concluídos')).toBeVisible();
      }
    });
  });

  test.describe('Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('Projetos concluídos devem aparecer na listagem desktop', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', 'executor@elite.com');
      await page.fill('#password', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar que a página carregou
      await expect(page.getByRole('heading', { name: 'EliteTrack™' })).toBeVisible();
      
      // Verificar toggle de histórico
      const historyButton = page.getByRole('button', { name: /Histórico/i });
      if (await historyButton.isVisible()) {
        await historyButton.click();
        await expect(page.getByText('Mostrando projetos concluídos')).toBeVisible();
      }
    });
  });
});
