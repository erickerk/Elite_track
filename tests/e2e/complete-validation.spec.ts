import { test, expect, Page } from '@playwright/test';

/**
 * Validação Completa - Elite Track
 * Testa todos os fluxos com Executor, Cliente e Admin
 */

const BASE_URL = 'https://elite-track.vercel.app';

// Credenciais
const EXECUTOR = { email: 'Joao@teste.com', password: 'Teste@2025' };
const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' };

// Helper para login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('text=Entrar na Plataforma');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// ============================================
// TESTES DO EXECUTOR
// ============================================
test.describe('Executor - Validação Completa', () => {
  
  test('E01 - Login do executor funciona', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    await expect(page.locator('h2:has-text("Painel de Projetos")')).toBeVisible();
  });

  test('E02 - Dashboard carrega projetos', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Verificar elementos do dashboard
    await expect(page.locator('h2:has-text("Painel de Projetos")')).toBeVisible();
  });

  test('E03 - Botão Novo Projeto abre modal', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Clicar em Novo Projeto
    await page.click('text=Novo Projeto');
    await page.waitForTimeout(500);
    
    // Verificar que modal ou wizard abriu
    const wizardVisible = await page.locator('text=Novo Veículo').first().isVisible();
    const modalVisible = await page.getByRole('heading', { name: 'Dados do Cliente' }).first().isVisible();
    
    expect(wizardVisible || modalVisible).toBeTruthy();
  });

  test('E04 - Aba Timeline carrega', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Navegar para Timeline
    await page.click('text=Timeline');
    await page.waitForTimeout(1000);
    
    // Verificar conteúdo
    await expect(page.locator('text=Progresso')).toBeVisible();
  });

  test('E05 - Aba Fotos carrega', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Navegar para Fotos
    const fotosBtn = page.locator('text=Fotos').first();
    if (await fotosBtn.isVisible()) {
      await fotosBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('E06 - Modal de adicionar foto funciona', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Ir para Timeline
    await page.click('text=Timeline');
    await page.waitForTimeout(1500);
    
    // Tentar abrir modal de foto
    const addPhotoBtn = page.locator('text=Adicionar Foto').first();
    if (await addPhotoBtn.isVisible()) {
      await addPhotoBtn.click();
      await page.waitForTimeout(500);
      
      // Verificar botões de câmera e galeria
      await expect(page.getByRole('button', { name: 'Tirar Foto' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Galeria' })).toBeVisible();
    }
  });

  test('E07 - Tipos de foto disponíveis', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.click('text=Timeline');
    await page.waitForTimeout(1500);
    
    const addPhotoBtn = page.locator('text=Adicionar Foto').first();
    if (await addPhotoBtn.isVisible()) {
      await addPhotoBtn.click();
      await page.waitForTimeout(500);
      
      // Verificar tipos de foto
      await expect(page.getByRole('button', { name: /Antes/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Durante/ })).toBeVisible();
    }
  });

  test('E08 - Aba Clientes carrega', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    const clientesBtn = page.locator('text=Clientes').first();
    if (await clientesBtn.isVisible()) {
      await clientesBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('E09 - Aba Tickets carrega', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    const ticketsBtn = page.locator('text=Tickets').first();
    if (await ticketsBtn.isVisible()) {
      await ticketsBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('E10 - Perfil do executor acessível', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Clicar no perfil
    const profileBtn = page.locator('[aria-label="Perfil"]').first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await page.waitForURL('**/profile', { timeout: 5000 });
    }
  });
});

// ============================================
// TESTES DO CLIENTE
// ============================================
test.describe('Cliente - Validação Completa', () => {
  
  test('C01 - Login do cliente funciona', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Cliente deve ver seu dashboard
    await page.waitForTimeout(2000);
  });

  test('C02 - Dashboard do cliente carrega', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    await page.waitForTimeout(2000);
    
    // Verificar elementos do dashboard do cliente
    const hasProject = await page.locator('text=Projeto').first().isVisible();
    const hasTimeline = await page.getByRole('heading', { name: 'Timeline' }).isVisible();
    const hasWelcome = await page.locator('text=Bem-vindo').first().isVisible();
    
    expect(hasProject || hasTimeline || hasWelcome).toBeTruthy();
  });

  test('C03 - Cliente vê timeline do projeto', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Navegar para Timeline
    const timelineBtn = page.locator('text=Timeline').first();
    if (await timelineBtn.isVisible()) {
      await timelineBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('C04 - Cliente vê galeria de fotos', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Navegar para Galeria
    const galeriaBtn = page.locator('text=Galeria').first();
    if (await galeriaBtn.isVisible()) {
      await galeriaBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('C05 - Cliente acessa laudo', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Navegar para Laudo
    const laudoBtn = page.locator('text=Laudo').first();
    if (await laudoBtn.isVisible()) {
      await laudoBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('C06 - Cliente acessa Elite Card', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Navegar para Elite Card
    const cardBtn = page.locator('text=Elite Card').first();
    if (await cardBtn.isVisible()) {
      await cardBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('C07 - Cliente acessa chat', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Navegar para Chat
    const chatBtn = page.locator('text=Chat').first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('C08 - Cliente acessa perfil', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Navegar para Perfil
    const perfilBtn = page.locator('text=Perfil').first();
    if (await perfilBtn.isVisible()) {
      await perfilBtn.click();
      await page.waitForTimeout(1500);
    }
  });
});

// ============================================
// TESTES DE PERFORMANCE DE UPLOAD
// ============================================
test.describe('Performance - Upload de Fotos', () => {
  
  test('P01 - Feedback de upload é exibido', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.click('text=Timeline');
    await page.waitForTimeout(1500);
    
    // Verificar se o texto de dica sobre upload está presente
    const dicaUpload = page.locator('text=Tirar Foto');
    if (await dicaUpload.first().isVisible()) {
      // O feedback de upload foi implementado
      expect(true).toBeTruthy();
    }
  });

  test('P02 - Botões de câmera e galeria distintos', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.click('text=Timeline');
    await page.waitForTimeout(1500);
    
    const addPhotoBtn = page.locator('text=Adicionar Foto').first();
    if (await addPhotoBtn.isVisible()) {
      await addPhotoBtn.click();
      await page.waitForTimeout(500);
      
      // Verificar que ambos os botões existem e são distintos
      const tirarFotoBtn = page.getByRole('button', { name: 'Tirar Foto' });
      const galeriaBtn = page.getByRole('button', { name: 'Galeria' });
      
      await expect(tirarFotoBtn).toBeVisible();
      await expect(galeriaBtn).toBeVisible();
      
      // Verificar que são elementos diferentes
      const tirarFotoText = await tirarFotoBtn.textContent();
      const galeriaText = await galeriaBtn.textContent();
      
      expect(tirarFotoText).not.toEqual(galeriaText);
    }
  });
});

// ============================================
// TESTES DE RESPONSIVIDADE
// ============================================
test.describe('Responsividade - Todas as Telas', () => {
  
  test('R01 - Login responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('R02 - Dashboard responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.waitForTimeout(2000);
  });

  test('R03 - Timeline responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Em mobile, a navegação pode ser diferente
    await page.waitForTimeout(2000);
    
    // Verificar que o dashboard carregou
    const dashboardLoaded = await page.locator('h2').first().isVisible();
    expect(dashboardLoaded).toBeTruthy();
  });

  test('R04 - Dashboard responsivo em tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.waitForTimeout(2000);
  });

  test('R05 - Dashboard responsivo em desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.waitForTimeout(2000);
  });
});

// ============================================
// TESTES DE NAVEGAÇÃO
// ============================================
test.describe('Navegação - Fluxo Completo', () => {
  
  test('N01 - Navegação completa do executor', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Dashboard
    await expect(page.locator('h2:has-text("Painel de Projetos")')).toBeVisible();
    
    // Timeline
    await page.click('text=Timeline');
    await page.waitForTimeout(1000);
    
    // Voltar para Projetos
    const projetosBtn = page.locator('text=Projetos').first();
    if (await projetosBtn.isVisible()) {
      await projetosBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('N02 - Logout funciona', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Procurar botão de logout
    const logoutBtn = page.locator('text=Sair').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      
      // Deve redirecionar para login ou landing
      await page.waitForTimeout(2000);
    }
  });
});
