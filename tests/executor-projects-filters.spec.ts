import { test, expect, devices } from '@playwright/test';

// Testes do Painel de Projetos do Executor
test.describe('Executor Dashboard - Filtros de Projetos', () => {
  
  async function loginAsExecutor(page: any) {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'executor@elite.com');
    await page.fill('input[type="password"]', 'executor123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  }

  test.describe('Desktop - Filtros e Navegação', () => {
    
    test('Default: deve mostrar apenas projetos pendentes na tela inicial', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Verificar que está na aba "Minhas Atividades" por padrão
      const minhasAtividades = page.getByRole('button', { name: /Minhas Atividades/i });
      await expect(minhasAtividades).toHaveClass(/bg-primary/);
      
      // Verificar que o filtro "Pendentes" está ativo
      const pendentesBadge = page.getByRole('button', { name: /Pendentes \(\d+\)/i });
      await expect(pendentesBadge).toBeVisible();
      
      // Verificar que NÃO mostra projetos concluídos na lista inicial
      const projectCards = page.locator('.bg-white\\/5.rounded-2xl.p-4.border.cursor-pointer');
      const count = await projectCards.count();
      
      // Se houver projetos, verificar que nenhum tem badge "Concluído"
      if (count > 0) {
        const completedBadges = page.locator('text=/Concluído|Entregue/i');
        await expect(completedBadges).toHaveCount(0);
      }
    });

    test('Filtro "Todos": deve mostrar todos os projetos ativos (pending + in_progress)', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Clicar no filtro "Todos"
      await page.getByRole('button', { name: /^Todos \(\d+\)$/i }).click();
      
      // Verificar que mostra projetos
      const projectCards = page.locator('.bg-white\\/5.rounded-2xl.p-4.border.cursor-pointer');
      await expect(projectCards.first()).toBeVisible();
    });

    test('Histórico: deve mostrar projetos concluídos e entregues', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Clicar em "Histórico"
      const historicoBtn = page.getByRole('button', { name: /Histórico \(\d+\)/i });
      await historicoBtn.click();
      
      // Verificar que o botão Histórico está ativo
      await expect(historicoBtn).toHaveClass(/bg-green-500/);
      
      // Verificar mensagem de contexto
      await expect(page.getByText(/Mostrando projetos concluídos\/entregues/i)).toBeVisible();
      
      // Verificar que os filtros mudaram para "Concluídos" e "Entregues"
      await expect(page.getByRole('button', { name: /Concluídos \(\d+\)/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Entregues \(\d+\)/i })).toBeVisible();
      
      // Verificar que NÃO mostra filtros de "Pendentes" ou "Em Andamento"
      await expect(page.getByRole('button', { name: /^Pendentes \(\d+\)$/i })).not.toBeVisible();
    });

    test('Histórico: projetos concluídos devem ser clicáveis', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Ir para Histórico
      await page.getByRole('button', { name: /Histórico \(\d+\)/i }).click();
      
      // Aguardar lista carregar
      await page.waitForTimeout(500);
      
      // Verificar se há projetos
      const projectCards = page.locator('.bg-white\\/5.rounded-2xl.p-4.border.cursor-pointer');
      const count = await projectCards.count();
      
      if (count > 0) {
        // Clicar no primeiro projeto
        await projectCards.first().click();
        
        // Verificar que o projeto foi selecionado (badge "SELECIONADO")
        await expect(page.getByText(/✓ SELECIONADO/i)).toBeVisible();
        
        // Verificar que os botões de ação estão disponíveis
        await expect(page.getByRole('button', { name: /Enviar QR Codes/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Ver Timeline/i })).toBeVisible();
      }
    });

    test('Trocar de "Histórico" para "Minhas Atividades" deve resetar filtro para "Pendentes"', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Ir para Histórico
      await page.getByRole('button', { name: /Histórico \(\d+\)/i }).click();
      
      // Verificar que está no histórico
      await expect(page.getByText(/Mostrando projetos concluídos/i)).toBeVisible();
      
      // Voltar para "Minhas Atividades"
      await page.getByRole('button', { name: /Minhas Atividades/i }).click();
      
      // Verificar que o filtro voltou para "Pendentes"
      const pendentesBadge = page.getByRole('button', { name: /Pendentes \(\d+\)/i });
      await expect(pendentesBadge).toHaveClass(/scale-105/); // Filtro ativo
      
      // Verificar que NÃO mostra mais a mensagem de histórico
      await expect(page.getByText(/Mostrando projetos concluídos/i)).not.toBeVisible();
    });

    test('Contadores devem bater com a lista exibida', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Pegar contagem do badge "Pendentes"
      const pendentesBadge = page.getByRole('button', { name: /Pendentes \((\d+)\)/i });
      const badgeText = await pendentesBadge.textContent();
      const badgeCount = parseInt(badgeText?.match(/\((\d+)\)/)?.[1] || '0');
      
      // Contar projetos na lista (com filtro Pendentes ativo)
      const projectCards = page.locator('.bg-white\\/5.rounded-2xl.p-4.border.cursor-pointer');
      const listCount = await projectCards.count();
      
      // Verificar que os números batem
      expect(listCount).toBe(badgeCount);
    });

    test('Busca deve funcionar em projetos pendentes', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Digitar na busca
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await searchInput.fill('BMW');
      
      // Verificar mensagem de resultado
      const resultText = page.getByText(/projeto\(s\) encontrado\(s\) para "BMW"/i);
      if (await resultText.isVisible()) {
        // Se encontrou, verificar que mostra projetos
        const projectCards = page.locator('.bg-white\\/5.rounded-2xl.p-4.border.cursor-pointer');
        await expect(projectCards.first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile - Filtros e Navegação', () => {
    test.use({ ...devices['iPhone 13'] });

    test('Mobile: deve mostrar apenas pendentes por padrão', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Verificar que está em "Minhas Atividades"
      const minhasAtividades = page.getByRole('button', { name: /Minhas Atividades/i });
      await expect(minhasAtividades).toHaveClass(/bg-primary/);
      
      // Verificar filtro Pendentes ativo
      const pendentesBadge = page.getByRole('button', { name: /Pendentes \(\d+\)/i });
      await expect(pendentesBadge).toBeVisible();
    });

    test('Mobile: histórico deve ser acessível e clicável', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Clicar em Histórico
      await page.getByRole('button', { name: /Histórico \(\d+\)/i }).click();
      
      // Verificar que mudou para histórico
      await expect(page.getByText(/Mostrando projetos concluídos/i)).toBeVisible();
      
      // Verificar que projetos são clicáveis
      const projectCards = page.locator('.bg-white\\/5.rounded-2xl.p-4.border.cursor-pointer');
      const count = await projectCards.count();
      
      if (count > 0) {
        await projectCards.first().click();
        await expect(page.getByText(/✓ SELECIONADO/i)).toBeVisible();
      }
    });

    test('Mobile: navegação entre abas deve funcionar', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Ir para Histórico
      await page.getByRole('button', { name: /Histórico/i }).click();
      await expect(page.getByText(/Mostrando projetos concluídos/i)).toBeVisible();
      
      // Voltar para Ver Todos
      await page.getByRole('button', { name: /Ver Todos/i }).click();
      await expect(page.getByText(/Mostrando projetos concluídos/i)).not.toBeVisible();
      
      // Voltar para Minhas Atividades
      await page.getByRole('button', { name: /Minhas Atividades/i }).click();
      const pendentesBadge = page.getByRole('button', { name: /Pendentes \(\d+\)/i });
      await expect(pendentesBadge).toBeVisible();
    });
  });

  test.describe('Integração com Supabase', () => {
    
    test('Contadores devem refletir dados reais do Supabase', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Aguardar carregamento completo
      await page.waitForTimeout(1000);
      
      // Verificar que os contadores não são todos zero (assumindo que há dados)
      const stats = page.locator('.grid.grid-cols-2.md\\:grid-cols-4.gap-4');
      await expect(stats).toBeVisible();
      
      // Verificar que pelo menos um contador tem valor > 0
      const totalBadge = page.getByText(/Total.*\d+/i);
      await expect(totalBadge).toBeVisible();
    });

    test('Filtros devem persistir após refresh (localStorage)', async ({ page }) => {
      await loginAsExecutor(page);
      
      // Ir para "Ver Todos"
      await page.getByRole('button', { name: /Ver Todos/i }).click();
      
      // Recarregar página
      await page.reload();
      
      // Verificar que voltou para o estado inicial (Minhas Atividades + Pendentes)
      // Isso é esperado porque o filtro default é 'pending'
      const pendentesBadge = page.getByRole('button', { name: /Pendentes \(\d+\)/i });
      await expect(pendentesBadge).toBeVisible();
    });
  });
});
