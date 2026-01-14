import { test, expect } from '@playwright/test';

/**
 * RCA - Testes que REPRODUZEM os 3 bugs críticos
 * Estes testes devem FALHAR inicialmente para identificar a causa raiz
 */

test.describe('RCA: Bug 1 - QR Scanner Landing Page', () => {
  
  test('Landing Page: "Escanear QR Code" deve abrir câmera', async ({ page, context }) => {
    // Mock getUserMedia para simular câmera
    await context.grantPermissions(['camera']);
    
    await page.addInitScript(() => {
      // Mock navigator.mediaDevices.getUserMedia
      const mockStream = {
        getTracks: () => [{
          kind: 'video',
          stop: () => {},
          getSettings: () => ({ facingMode: 'environment' })
        }],
        getVideoTracks: () => [{
          kind: 'video',
          stop: () => {},
          getSettings: () => ({ facingMode: 'environment' })
        }]
      };
      
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        writable: true,
        value: async () => mockStream
      });
    });
    
    // 1. Ir para Landing Page (pública, sem login)
    await page.goto('/');
    
    // 2. Scroll para a seção de consulta pública
    await page.evaluate(() => {
      const consultaSection = document.querySelector('button[onclick*="scan"]') || 
                              document.querySelector('button:has-text("Escanear QR")');
      consultaSection?.scrollIntoView({ behavior: 'smooth' });
    });
    
    // 3. Clicar no botão "Escanear QR Code" (modal de consulta pública)
    const modalButton = page.locator('button:has-text("Consultar Histórico")').first();
    await modalButton.waitFor({ state: 'visible', timeout: 5000 });
    await modalButton.click();
    
    // 4. Modal abre - clicar em "Escanear QR Code"
    const scanButton = page.locator('button:has-text("Escanear QR Code")');
    await scanButton.waitFor({ state: 'visible', timeout: 3000 });
    
    // Screenshot ANTES de clicar
    await page.screenshot({ path: 'test-results/rca-bug1-before-click.png', fullPage: true });
    
    await scanButton.click();
    
    // 5. Deve navegar para /scan?mode=verify
    await page.waitForURL('**/scan?mode=verify', { timeout: 5000 });
    
    // 6. VERIFICAR: UI do scanner deve carregar
    const scannerHeader = page.locator('text=Scanner QR').or(page.locator('h1:has-text("Scanner")'));
    await expect(scannerHeader).toBeVisible({ timeout: 3000 });
    
    // 7. VERIFICAR: Elemento <video> deve estar presente E visível
    const video = page.locator('video');
    await expect(video).toBeVisible({ timeout: 5000 });
    
    // 8. VERIFICAR: scanState deve ser 'active' (não 'idle' ou 'requesting' infinitamente)
    // Aguardar até que o estado mude de 'requesting' para 'active'
    await page.waitForFunction(
      () => {
        const requestingText = document.querySelector('text=Acessando câmera');
        return !requestingText || window.getComputedStyle(requestingText).display === 'none';
      },
      { timeout: 8000 }
    );
    
    // Screenshot DEPOIS de abrir
    await page.screenshot({ path: 'test-results/rca-bug1-scanner-opened.png', fullPage: true });
    
    // 9. VERIFICAR: Controles da câmera devem estar visíveis (flash, switch camera)
    const cameraControls = page.locator('button[aria-label*="câmera"], button[aria-label*="flash"]').first();
    await expect(cameraControls).toBeVisible({ timeout: 3000 });
    
    // Console logs para debug
    const logs: string[] = [];
    page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
    
    console.log('Console logs durante abertura do scanner:', logs);
  });
  
  test('Landing Page: fallback se câmera falhar', async ({ page }) => {
    // Negar permissão de câmera para testar fallback
    await page.goto('/');
    
    const modalButton = page.locator('button:has-text("Consultar Histórico")').first();
    await modalButton.click();
    
    const scanButton = page.locator('button:has-text("Escanear QR Code")');
    await scanButton.click();
    
    await page.waitForURL('**/scan?mode=verify');
    
    // Deve mostrar erro OU opção de upload de imagem
    const errorMessage = page.locator('text=Permissão Negada, text=Câmera não encontrada, text=erro').first();
    const uploadButton = page.locator('button:has-text("Enviar Imagem"), input[type="file"]').first();
    
    await expect(errorMessage.or(uploadButton)).toBeVisible({ timeout: 8000 });
    
    await page.screenshot({ path: 'test-results/rca-bug1-fallback.png', fullPage: true });
  });
});

test.describe('RCA: Bug 2 - Cliente Erick (fotos + tela preta)', () => {
  
  test('Cliente Erick: deve mostrar fotos do projeto', async ({ page }) => {
    // 1. Login como cliente Erick
    await page.goto('/login');
    await page.fill('input[type="email"]', 'erick@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    // 2. Aguardar redirecionamento para dashboard do cliente
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Screenshot do dashboard
    await page.screenshot({ path: 'test-results/rca-bug2-dashboard.png', fullPage: true });
    
    // 3. VERIFICAR: Não deve haver tela preta (body deve ter conteúdo)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toBe('');
    expect(bodyContent?.length).toBeGreaterThan(100);
    
    // 4. VERIFICAR: Projeto deve estar visível
    const projectCard = page.locator('[class*="project"], [class*="vehicle"], [data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 5000 });
    
    // 5. Navegar para o projeto (clicar no card ou botão "Ver Detalhes")
    const viewButton = projectCard.locator('button:has-text("Ver"), button:has-text("Abrir"), button:has-text("Detalhes")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
    } else {
      await projectCard.click();
    }
    
    // Screenshot após clicar
    await page.screenshot({ path: 'test-results/rca-bug2-after-click.png', fullPage: true });
    
    // 6. VERIFICAR: Página não deve ficar preta
    await page.waitForTimeout(2000); // Aguardar render
    const afterClickContent = await page.locator('body').textContent();
    expect(afterClickContent).not.toBe('');
    
    // 7. VERIFICAR: Fotos devem estar presentes (galeria ou grid de fotos)
    const photos = page.locator('img[src*="photo"], img[src*="image"], img[alt*="foto"], [class*="photo"], [class*="gallery"]');
    const photoCount = await photos.count();
    
    console.log(`Fotos encontradas: ${photoCount}`);
    
    // Deve ter pelo menos 1 foto
    expect(photoCount).toBeGreaterThan(0);
    
    // Screenshot final
    await page.screenshot({ path: 'test-results/rca-bug2-photos.png', fullPage: true });
    
    // Console logs
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    console.log('Erros JS durante navegação:', errors);
  });
  
  test('Cliente Erick: navegação não deve crashar', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'erick@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Coletar erros
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    // Navegar entre abas/seções
    const tabs = page.locator('button[role="tab"], [class*="tab-"]');
    const tabCount = await tabs.count();
    
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(1000);
      
      // Verificar que não ficou preta
      const content = await page.locator('body').textContent();
      expect(content).not.toBe('');
    }
    
    // Não deve ter erros JS críticos
    expect(errors.length).toBe(0);
    
    await page.screenshot({ path: 'test-results/rca-bug2-navigation.png', fullPage: true });
  });
});

test.describe('RCA: Bug 3 - Executor não vê cliente Erick + filtro Concluídos', () => {
  
  test('Executor joao@teste.com: deve ver cliente Erick', async ({ page }) => {
    // 1. Login como executor João
    await page.goto('/login');
    await page.fill('input[type="email"]', 'joao@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.screenshot({ path: 'test-results/rca-bug3-executor-dashboard.png', fullPage: true });
    
    // 2. Ir para aba de clientes ou projetos
    const clientsTab = page.locator('button:has-text("Clientes"), [data-tab="clients"]').first();
    if (await clientsTab.isVisible({ timeout: 3000 })) {
      await clientsTab.click();
      await page.waitForTimeout(1000);
    }
    
    // 3. VERIFICAR: Cliente "Erick" deve aparecer na lista
    const erickClient = page.locator('text=Erick, [data-client*="erick"], [class*="client"]:has-text("Erick")').first();
    
    await page.screenshot({ path: 'test-results/rca-bug3-before-search.png', fullPage: true });
    
    // Se não estiver visível, tentar filtro "Todos"
    const todosFilter = page.locator('button:has-text("Todos")').first();
    if (await todosFilter.isVisible({ timeout: 2000 })) {
      await todosFilter.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(erickClient).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'test-results/rca-bug3-erick-visible.png', fullPage: true });
  });
  
  test('Executor: filtro "Concluídos" deve existir e funcionar', async ({ page, isMobile }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'joao@teste.com');
    await page.fill('input[type="password"]', 'teste123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Desktop: filtro deve estar visível como chip/tab
    // Mobile: pode estar dentro de um botão "Filtros"
    
    let concluidosFilter;
    
    if (isMobile) {
      // Procurar botão "Filtros" ou menu mobile
      const filtrosButton = page.locator('button:has-text("Filtros"), button[aria-label*="Filtro"]').first();
      if (await filtrosButton.isVisible({ timeout: 2000 })) {
        await filtrosButton.click();
      }
      
      concluidosFilter = page.locator('button:has-text("Concluídos"), [data-filter="completed"]').first();
    } else {
      // Desktop: procurar diretamente
      concluidosFilter = page.locator('button:has-text("Concluídos"), [data-filter="completed"]').first();
    }
    
    await page.screenshot({ path: 'test-results/rca-bug3-before-filter.png', fullPage: true });
    
    // VERIFICAR: Filtro "Concluídos" deve existir
    await expect(concluidosFilter).toBeVisible({ timeout: 5000 });
    
    // Clicar no filtro
    await concluidosFilter.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/rca-bug3-filter-applied.png', fullPage: true });
    
    // VERIFICAR: Lista deve mudar (mostrar apenas concluídos)
    // Pode estar vazia se não houver projetos concluídos, mas não deve crashar
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toBe('');
  });
});
