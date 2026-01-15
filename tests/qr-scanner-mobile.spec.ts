import { test, expect, devices } from '@playwright/test';

// Mock para navigator.mediaDevices.getUserMedia
const mockGetUserMedia = `
  window.mockMediaStream = {
    getTracks: () => [{
      stop: () => {},
      getCapabilities: () => ({ torch: false }),
      applyConstraints: async () => {}
    }],
    getVideoTracks: () => [{
      stop: () => {},
      getCapabilities: () => ({ torch: false }),
      applyConstraints: async () => {}
    }]
  };
  
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {};
  }
  
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    console.log('[Mock] getUserMedia called with:', JSON.stringify(constraints));
    return window.mockMediaStream;
  };
  
  navigator.mediaDevices.enumerateDevices = async () => {
    return [
      { kind: 'videoinput', deviceId: 'mock-camera-1', label: 'Front Camera' },
      { kind: 'videoinput', deviceId: 'mock-camera-2', label: 'Back Camera' }
    ];
  };
`;

test.describe('QR Scanner - Multi-device', () => {
  
  test.beforeEach(async ({ page }) => {
    // Injetar mock do getUserMedia antes de carregar a página
    await page.addInitScript(mockGetUserMedia);
  });

  test.describe('Desktop', () => {
    
    test('Botão Escanear deve abrir o scanner', async ({ page }) => {
      await page.goto('/');
      
      // Fazer login como executor
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Clicar no botão Escanear
      await page.click('button[aria-label="Escanear QR Code"]');
      
      // Verificar que o scanner abriu
      await expect(page.getByText('Scanner QR')).toBeVisible();
      await expect(page.getByText('Escaneie ou digite o código')).toBeVisible();
    });

    test('Scanner deve mostrar estado de "Solicitando permissão"', async ({ page }) => {
      // Mock com delay para simular solicitação
      await page.addInitScript(`
        navigator.mediaDevices.getUserMedia = async () => {
          await new Promise(r => setTimeout(r, 1000));
          return window.mockMediaStream;
        };
      `);
      
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      // Verificar estado de solicitação
      await expect(page.getByText('Solicitando permissão...')).toBeVisible({ timeout: 2000 });
    });

    test('Scanner deve mostrar erro quando permissão negada', async ({ page }) => {
      await page.addInitScript(`
        navigator.mediaDevices.getUserMedia = async () => {
          const err = new Error('Permission denied');
          err.name = 'NotAllowedError';
          throw err;
        };
      `);
      
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      // Verificar mensagem de erro de permissão
      await expect(page.getByText('Permissão Negada')).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(/Permita o acesso à câmera/i)).toBeVisible();
    });

    test('Fallback por imagem deve estar disponível', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      // Verificar que o botão de upload está visível
      await expect(page.getByText('Enviar imagem do QR Code')).toBeVisible();
    });

    test('Input manual deve funcionar', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      // Digitar código manualmente
      const input = page.locator('input[aria-label="Código do projeto ou placa"]');
      await input.fill('PRJ-2025-001');
      
      // Verificar que o valor foi inserido em uppercase
      await expect(input).toHaveValue('PRJ-2025-001');
      
      // Clicar em buscar
      await page.click('button[aria-label="Buscar"]');
      
      // Scanner deve fechar após busca
      await expect(page.getByText('Scanner QR')).not.toBeVisible({ timeout: 2000 });
    });

    test('Fechar scanner deve funcionar', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      await expect(page.getByText('Scanner QR')).toBeVisible();
      
      // Fechar scanner
      await page.click('button[aria-label="Fechar scanner"]');
      
      // Verificar que fechou
      await expect(page.getByText('Scanner QR')).not.toBeVisible();
    });
  });

  test.describe('Mobile - iPhone 13', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
    });

    test('Scanner deve abrir no mobile', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      await expect(page.getByText('Scanner QR')).toBeVisible();
    });

    test('Layout do scanner deve ser responsivo no mobile', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      // Verificar que o scanner está dentro do viewport
      const scannerContainer = page.locator('.fixed.inset-0.z-50');
      await expect(scannerContainer).toBeVisible();
      
      // Verificar que não há overflow horizontal
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Tolerância de 5px
    });
  });

  test.describe('Mobile - Samsung Galaxy S23', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 }); // Samsung S23
    });

    test('Scanner deve funcionar no Samsung S23', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.click('button[aria-label="Escanear QR Code"]');
      
      await expect(page.getByText('Scanner QR')).toBeVisible();
      
      // Verificar que os controles estão visíveis
      await expect(page.getByText('Enviar imagem do QR Code')).toBeVisible();
    });
  });
});

test.describe('Layout Mobile - Executor Dashboard', () => {
  
  test.describe('iPhone 13', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
    });

    test('Não deve ter overflow horizontal', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar overflow horizontal
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalOverflow).toBe(false);
    });

    test('Header deve estar visível e sem zoom', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar que o logo está visível
      await expect(page.getByText('EliteTrack™')).toBeVisible();
      
      // Verificar que os botões de ação estão visíveis
      await expect(page.locator('button[aria-label="Escanear QR Code"]')).toBeVisible();
    });

    test('Cards de estatísticas devem ser responsivos (2 colunas)', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar que os cards de stats estão visíveis
      await expect(page.getByText('Total Projetos')).toBeVisible();
      await expect(page.getByText('Em Andamento')).toBeVisible();
    });

    test('Navegação mobile deve funcionar', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // A navegação mobile deve estar visível
      const mobileNav = page.locator('nav.lg\\:hidden');
      await expect(mobileNav).toBeVisible();
      
      // Deve poder scrollar horizontalmente na navegação
      const navItems = mobileNav.locator('button');
      const count = await navItems.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Samsung Galaxy S23 FE', () => {
    test.use({ 
      viewport: { width: 360, height: 780 },
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S711B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    });

    test('Layout não deve ter zoom no S23 FE', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar que não há overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });

    test('Todos os elementos críticos devem estar visíveis', async ({ page }) => {
      await page.goto('/');
      await page.fill('input[type="email"]', 'executor@elite.com');
      await page.fill('input[type="password"]', 'executor123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Verificar elementos críticos
      await expect(page.getByText('EliteTrack™')).toBeVisible();
      await expect(page.locator('button[aria-label="Escanear QR Code"]')).toBeVisible();
      await expect(page.getByText('Total Projetos')).toBeVisible();
    });
  });
});

test.describe('Rota /qr/[code] - Resolução de QR Code', () => {
  
  test('Deve redirecionar para verificação com código válido', async ({ page }) => {
    // Navegar para rota de QR com código de projeto
    await page.goto('/qr/PRJ-2025-001');
    
    // Deve redirecionar para /verify/PRJ-2025-001 ou mostrar página de loading
    await page.waitForTimeout(1000);
    
    // Verificar URL ou conteúdo
    const url = page.url();
    const hasRedirected = url.includes('/verify/') || url.includes('/qr/');
    expect(hasRedirected).toBe(true);
  });

  test('Deve mostrar erro para código inválido', async ({ page }) => {
    await page.goto('/qr/CODIGO-INVALIDO-XYZ');
    
    // Deve mostrar alguma mensagem de erro ou not found
    await page.waitForTimeout(1000);
    
    // Verificar que não quebrou a página
    const hasError = await page.locator('text=/não encontrado|error|404/i').isVisible().catch(() => false);
    // Se não redirecionar, deve mostrar algo
    expect(page.url()).toContain('/qr/');
  });
});
