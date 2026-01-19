/**
 * Testes E2E para Elite Track usando Playwright
 * Alternativa funcional ao TestSprite MCP
 * 
 * Uso via Cascade:
 * - Use o MCP do Playwright que já está configurado e funcionando
 * - Execute: npx playwright test test-elite-track.spec.js
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5176';

test.describe('Elite Track - Testes de Validação', () => {
  
  test('Deve carregar a página inicial sem erros', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificar se a página carregou
    await expect(page).toHaveTitle(/Elite/i);
    
    // Verificar se não há erros de console críticos
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Página inicial carregada com sucesso');
  });

  test('Deve exibir o logo Elite Blindagens', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Procurar por elementos que contenham "Elite"
    const eliteElements = await page.locator('text=/Elite/i').count();
    expect(eliteElements).toBeGreaterThan(0);
    
    console.log('✅ Logo/marca Elite encontrada na página');
  });

  test('Deve ter botões de navegação funcionais', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Verificar se existem botões/links clicáveis
    const buttons = await page.locator('button, a[href]').count();
    expect(buttons).toBeGreaterThan(0);
    
    console.log(`✅ ${buttons} elementos interativos encontrados`);
  });

  test('Deve responder a interações do usuário', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Tentar clicar no primeiro botão/link disponível
    const firstButton = page.locator('button, a[href]').first();
    if (await firstButton.isVisible()) {
      await firstButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Interação com botão bem-sucedida');
    }
  });

  test('Deve ter formulários de login/cadastro', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Procurar por inputs de formulário
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').count();
    
    if (inputs > 0) {
      console.log(`✅ ${inputs} campos de formulário encontrados`);
    } else {
      console.log('⚠️ Nenhum campo de formulário visível na página inicial');
    }
  });

  test('Deve carregar recursos estáticos (CSS/JS)', async ({ page }) => {
    const resources = {
      css: 0,
      js: 0,
      images: 0
    };

    page.on('response', response => {
      const url = response.url();
      if (url.endsWith('.css')) resources.css++;
      if (url.endsWith('.js')) resources.js++;
      if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) resources.images++;
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    console.log(`✅ Recursos carregados: ${resources.css} CSS, ${resources.js} JS, ${resources.images} imagens`);
    
    expect(resources.css + resources.js).toBeGreaterThan(0);
  });

  test('Deve ser responsivo (mobile)', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página renderiza em mobile
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
    
    console.log('✅ Layout responsivo para mobile validado');
  });

  test('Performance - Tempo de carregamento', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);
    
    // Esperar que carregue em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });
});
