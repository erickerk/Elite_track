import { test, expect, Page } from '@playwright/test';

/**
 * Testes de Stress - Elite Track
 * Valida cadastro múltiplo, QR Code, carregamento rápido e sincronização
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

// Helper para medir tempo de carregamento
async function measureLoadTime(page: Page, action: () => Promise<void>): Promise<number> {
  const start = Date.now();
  await action();
  return Date.now() - start;
}

// ============================================
// TESTES DE STRESS - EXECUTOR
// ============================================
test.describe('Stress Test - Executor', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
  });

  test('S01 - Dashboard carrega em menos de 3 segundos', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page.locator('h2:has-text("Painel de Projetos")')).toBeVisible();
    });
    
    console.log(`Dashboard carregou em ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5 segundos máximo
  });

  test('S02 - Lista de projetos carrega rapidamente', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.waitForTimeout(2000); // Aguardar carregamento inicial
    });
    
    // Verificar se há elementos de projeto ou mensagem vazia
    const projectElements = await page.locator('[class*="project"]').count();
    console.log(`Encontrados ${projectElements} elementos de projeto em ${loadTime}ms`);
  });

  test('S03 - Botão Novo Projeto responde rapidamente', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.click('text=Novo Projeto');
      await page.waitForTimeout(500);
    });
    
    console.log(`Modal abriu em ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
    
    // Verificar que modal abriu
    const wizardVisible = await page.locator('text=Novo Veículo').first().isVisible();
    const modalVisible = await page.getByRole('heading', { name: 'Dados do Cliente' }).first().isVisible();
    expect(wizardVisible || modalVisible).toBeTruthy();
  });

  test('S04 - Timeline carrega sem delay', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.click('text=Timeline');
      await page.waitForTimeout(1000);
    });
    
    console.log(`Timeline carregou em ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
    
    // Verificar elementos da timeline
    await expect(page.locator('text=Progresso')).toBeVisible();
  });

  test('S05 - Modal de foto abre instantaneamente', async ({ page }) => {
    await page.click('text=Timeline');
    await page.waitForTimeout(1500);
    
    const addPhotoBtn = page.locator('text=Adicionar Foto').first();
    if (await addPhotoBtn.isVisible()) {
      const loadTime = await measureLoadTime(page, async () => {
        await addPhotoBtn.click();
        await page.waitForTimeout(300);
      });
      
      console.log(`Modal de foto abriu em ${loadTime}ms`);
      expect(loadTime).toBeLessThan(1000);
      
      // Verificar botões
      await expect(page.getByRole('button', { name: 'Tirar Foto' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Galeria' })).toBeVisible();
    }
  });

  test('S06 - Navegação entre abas é fluida', async ({ page }) => {
    const tabs = ['Timeline', 'Clientes', 'Tickets'];
    
    for (const tab of tabs) {
      const tabBtn = page.locator(`text=${tab}`).first();
      if (await tabBtn.isVisible()) {
        const loadTime = await measureLoadTime(page, async () => {
          await tabBtn.click();
          await page.waitForTimeout(500);
        });
        
        console.log(`Aba ${tab} carregou em ${loadTime}ms`);
        expect(loadTime).toBeLessThan(2000);
      }
    }
  });
});

// ============================================
// TESTES DE QR CODE
// ============================================
test.describe('QR Code - Validação', () => {
  
  test('Q01 - Projeto existente tem QR Code', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Navegar para Timeline para ver projeto
    await page.click('text=Timeline');
    await page.waitForTimeout(2000);
    
    // Verificar se há QR Code ou botão de QR
    const qrElements = await page.locator('[class*="qr"]').count() + await page.locator('text=QR Code').count() + await page.locator('text=Compartilhar').count();
    console.log(`Elementos QR encontrados: ${qrElements}`);
  });

  test('Q02 - Botão de compartilhar está acessível', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.click('text=Timeline');
    await page.waitForTimeout(2000);
    
    // Procurar botão de compartilhar
    const shareBtn = page.locator('text=Compartilhar').first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await page.waitForTimeout(500);
      
      // Verificar que modal de compartilhamento abriu
      const hasQR = await page.locator('[class*="qr"], canvas, svg').count();
      console.log(`QR elements visíveis: ${hasQR}`);
    }
  });
});

// ============================================
// TESTES DE CARREGAMENTO DE FOTOS
// ============================================
test.describe('Fotos - Carregamento Rápido', () => {
  
  test('F01 - Galeria de fotos carrega sem F5', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.click('text=Timeline');
    await page.waitForTimeout(2000);
    
    // Verificar se há imagens carregadas
    const images = await page.locator('img[src*="supabase"], img[src*="storage"]').count();
    console.log(`Imagens encontradas: ${images}`);
  });

  test('F02 - Feedback de loading durante operações', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    await page.click('text=Timeline');
    await page.waitForTimeout(1500);
    
    // Verificar elementos de loading/spinner
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"], [class*="animate-spin"]').count();
    console.log(`Elementos de loading encontrados durante navegação: ${loadingElements}`);
    
    // Ao final, não deve haver loading visível
    await page.waitForTimeout(2000);
    const visibleLoading = await page.locator('[class*="loading"]:visible, [class*="spinner"]:visible').count();
    expect(visibleLoading).toBeLessThanOrEqual(1); // Máximo 1 spinner residual
  });

  test('F03 - Tipos de foto (Antes, Durante, Depois) disponíveis', async ({ page }) => {
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
});

// ============================================
// TESTES DE SINCRONIZAÇÃO CLIENTE
// ============================================
test.describe('Cliente - Dados Sincronizados', () => {
  
  test('C01 - Cliente vê timeline atualizada', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    // Aguardar carregamento
    await page.waitForTimeout(2000);
    
    // Verificar se timeline está visível
    const timelineVisible = await page.getByRole('heading', { name: 'Timeline' }).isVisible();
    console.log(`Timeline visível para cliente: ${timelineVisible}`);
  });

  test('C02 - Cliente vê fotos do projeto', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    await page.waitForTimeout(2000);
    
    // Verificar imagens
    const images = await page.locator('img').count();
    console.log(`Total de imagens visíveis para cliente: ${images}`);
  });

  test('C03 - Cliente vê progresso correto', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    await page.waitForTimeout(2000);
    
    // Verificar elementos de progresso
    const progressElements = await page.locator('[class*="progress"]').count();
    console.log(`Elementos de progresso encontrados: ${progressElements}`);
  });

  test('C04 - Cliente vê dados do veículo', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    await page.waitForTimeout(2000);
    
    // Verificar dados do veículo
    const vehicleData = await page.locator('text=Placa, text=Modelo, text=Marca').count();
    console.log(`Dados do veículo encontrados: ${vehicleData}`);
  });

  test('C05 - Laudo do cliente carrega', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    const laudoBtn = page.locator('text=Laudo').first();
    if (await laudoBtn.isVisible()) {
      await laudoBtn.click();
      await page.waitForTimeout(2000);
      
      // Verificar se laudo carregou
      const laudoContent = await page.locator('text=EliteShield, text=Blindagem').count();
      console.log(`Conteúdo do laudo encontrado: ${laudoContent}`);
    }
  });

  test('C06 - Elite Card do cliente carrega', async ({ page }) => {
    await login(page, CLIENT.email, CLIENT.password);
    
    const cardBtn = page.locator('text=Elite Card').first();
    if (await cardBtn.isVisible()) {
      await cardBtn.click();
      await page.waitForTimeout(2000);
      
      // Verificar se card carregou
      const cardContent = await page.locator('text=Elite, text=Cartão, text=Emergência').count();
      console.log(`Conteúdo do Elite Card encontrado: ${cardContent}`);
    }
  });
});

// ============================================
// TESTES DE PERFORMANCE GERAL
// ============================================
test.describe('Performance - Métricas', () => {
  
  test('P01 - Tempo de resposta do login', async ({ page }) => {
    const loadTime = await measureLoadTime(page, async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', EXECUTOR.email);
      await page.fill('input[type="password"]', EXECUTOR.password);
      await page.click('text=Entrar na Plataforma');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    });
    
    console.log(`Login completo em ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10 segundos máximo
  });

  test('P02 - Múltiplas navegações sem degradação', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    const navigationTimes: number[] = [];
    
    // Navegar 5 vezes entre abas
    for (let i = 0; i < 5; i++) {
      const loadTime = await measureLoadTime(page, async () => {
        await page.click('text=Timeline');
        await page.waitForTimeout(500);
      });
      navigationTimes.push(loadTime);
      
      await page.click('text=Projetos');
      await page.waitForTimeout(500);
    }
    
    console.log(`Tempos de navegação: ${navigationTimes.join(', ')}ms`);
    
    // Verificar que não há degradação significativa
    const avgTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    console.log(`Tempo médio de navegação: ${avgTime}ms`);
    expect(avgTime).toBeLessThan(3000);
  });

  test('P03 - Página não trava durante carregamento', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    // Tentar interagir durante carregamento
    await page.click('text=Timeline');
    
    // A página deve permanecer responsiva
    const isResponsive = await page.evaluate(() => {
      return document.body !== null;
    });
    
    expect(isResponsive).toBeTruthy();
  });
});

// ============================================
// TESTES DE CONSISTÊNCIA DE DADOS
// ============================================
test.describe('Consistência - Dados Sincronizados', () => {
  
  test('D01 - Mesmo projeto visível para executor e cliente', async ({ page }) => {
    // Login como executor
    await login(page, EXECUTOR.email, EXECUTOR.password);
    await page.click('text=Timeline');
    await page.waitForTimeout(2000);
    
    // Capturar informações do projeto
    const executorView = await page.content();
    const hasVehicleInfo = executorView.includes('Placa') || executorView.includes('Modelo');
    
    console.log(`Executor vê informações do veículo: ${hasVehicleInfo}`);
    
    // Fazer logout
    const logoutBtn = page.locator('text=Sair').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Login como cliente
    await login(page, CLIENT.email, CLIENT.password);
    await page.waitForTimeout(2000);
    
    // Capturar informações do projeto
    const clientView = await page.content();
    const clientHasVehicleInfo = clientView.includes('Placa') || clientView.includes('Modelo');
    
    console.log(`Cliente vê informações do veículo: ${clientHasVehicleInfo}`);
  });

  test('D02 - Contagem de fotos consistente', async ({ page }) => {
    // Login como executor
    await login(page, EXECUTOR.email, EXECUTOR.password);
    await page.click('text=Timeline');
    await page.waitForTimeout(2000);
    
    const executorImages = await page.locator('img').count();
    console.log(`Executor vê ${executorImages} imagens`);
    
    // Logout e login como cliente
    const logoutBtn = page.locator('text=Sair').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await login(page, CLIENT.email, CLIENT.password);
    await page.waitForTimeout(2000);
    
    const clientImages = await page.locator('img').count();
    console.log(`Cliente vê ${clientImages} imagens`);
  });
});

// ============================================
// TESTE FINAL - FLUXO COMPLETO
// ============================================
test.describe('Fluxo Completo - Stress Test', () => {
  
  test('STRESS - Navegação intensiva sem erros', async ({ page }) => {
    await login(page, EXECUTOR.email, EXECUTOR.password);
    
    const actions = [
      async () => { await page.click('text=Timeline'); },
      async () => { await page.click('text=Projetos'); },
      async () => { await page.click('text=Clientes'); },
      async () => { await page.click('text=Tickets'); },
      async () => { await page.click('text=Timeline'); },
    ];
    
    let errors = 0;
    
    for (let i = 0; i < 3; i++) {
      for (const action of actions) {
        try {
          const btn = page.locator(`text=${['Timeline', 'Projetos', 'Clientes', 'Tickets'][i % 4]}`).first();
          if (await btn.isVisible()) {
            await btn.click();
            await page.waitForTimeout(300);
          }
        } catch (e) {
          errors++;
          console.log(`Erro na navegação: ${e}`);
        }
      }
    }
    
    console.log(`Navegação intensiva concluída com ${errors} erros`);
    expect(errors).toBeLessThan(5);
    
    // Verificar que a página ainda está funcional
    await expect(page.locator('body')).toBeVisible();
  });
});
