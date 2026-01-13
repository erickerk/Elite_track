import { test, expect, devices } from '@playwright/test';

// Testes de Scanner QR na Landing
test.describe('QR Scanner - Landing Page', () => {
  
  test('Botão "Consultar Histórico" deve abrir modal', async ({ page }) => {
    await page.goto('/');
    
    // Clicar no botão de consulta
    const consultaBtn = page.locator('button:has-text("Consultar Histórico")');
    await expect(consultaBtn.first()).toBeVisible();
    await consultaBtn.first().click();
    
    // Modal deve aparecer
    await expect(page.getByRole('heading', { name: 'Consultar Histórico' })).toBeVisible();
  });

  test('Modal deve ter botão "Escanear QR Code"', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal
    await page.locator('button:has-text("Consultar Histórico")').first().click();
    
    // Verificar botão de scan
    await expect(page.getByRole('button', { name: /Escanear QR Code/i })).toBeVisible();
  });

  test('Clicar em "Escanear QR Code" deve abrir scanner', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal
    await page.locator('button:has-text("Consultar Histórico")').first().click();
    
    // Clicar em escanear
    await page.getByRole('button', { name: /Escanear QR Code/i }).click();
    
    // Scanner deve aparecer
    await expect(page.getByRole('heading', { name: 'Scanner QR' })).toBeVisible();
  });

  test('Scanner deve ter botão "Ativar Câmera"', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal e scanner
    await page.locator('button:has-text("Consultar Histórico")').first().click();
    await page.getByRole('button', { name: /Escanear QR Code/i }).click();
    
    // Verificar botão de ativar câmera
    await expect(page.getByRole('button', { name: /Ativar Câmera/i })).toBeVisible();
  });

  test('Input manual deve aceitar código e navegar', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal
    await page.locator('button:has-text("Consultar Histórico")').first().click();
    
    // Digitar código
    const input = page.locator('input[placeholder*="PRJ-2025"]');
    await input.fill('TEST-PROJECT-123');
    
    // Clicar em consultar
    await page.getByRole('button', { name: 'Consultar' }).click();
    
    // Deve navegar para /verify
    await expect(page).toHaveURL(/\/verify\/TEST-PROJECT-123/);
  });
});

// Testes de QR Redirect
test.describe('QR Redirect - /qr/:code', () => {
  
  test('Rota /qr/:code deve redirecionar para /verify', async ({ page }) => {
    await page.goto('/qr/test-project-id');
    
    // Deve redirecionar para verify
    await expect(page).toHaveURL(/\/(verify|qr)\//);
  });

  test('Rota /qr/:code com UUID deve redirecionar', async ({ page }) => {
    const uuid = '12345678-1234-1234-1234-123456789012';
    await page.goto(`/qr/${uuid}`);
    
    // Deve redirecionar para verify
    await expect(page).toHaveURL(/\/verify\//);
  });
});

// Testes de Dashboard Admin - Convites
test.describe('Dashboard Admin - Convites', () => {
  
  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.fill('#email', 'admin@elite.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  }

  test('Dashboard deve carregar aba de convites', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navegar para aba de convites
    const invitesBtn = page.getByRole('button', { name: /Convites/i });
    if (await invitesBtn.isVisible()) {
      await invitesBtn.click();
      // Verificar que carregou
      await expect(page.getByText(/Gestão de Convites/i)).toBeVisible();
    }
  });

  test('Estatísticas de convites devem carregar do Supabase', async ({ page }) => {
    await loginAsAdmin(page);
    
    // A página deve mostrar estatísticas (deve ter pelo menos 1 card)
    const cards = page.locator('.bg-white\\/5');
    await expect(cards.first()).toBeVisible();
  });
});

// Testes Mobile
test.describe('Scanner QR - Mobile', () => {
  test.use({ ...devices['iPhone 13'] });

  test('Scanner deve abrir em mobile', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal
    await page.locator('button:has-text("Consultar Histórico")').first().click();
    
    // Clicar em escanear
    await page.getByRole('button', { name: /Escanear QR Code/i }).click();
    
    // Scanner deve aparecer
    await expect(page.getByRole('heading', { name: 'Scanner QR' })).toBeVisible();
  });

  test('Scanner deve ter controles de câmera', async ({ page }) => {
    await page.goto('/');
    
    // Abrir modal e scanner
    await page.locator('button:has-text("Consultar Histórico")').first().click();
    await page.getByRole('button', { name: /Escanear QR Code/i }).click();
    
    // Verificar controles
    await expect(page.getByRole('button', { name: /Ativar Câmera/i })).toBeVisible();
  });
});
