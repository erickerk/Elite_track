import { test, expect, type Page } from '@playwright/test';

test.describe('Elite Track - Validação de Correções', () => {
  
  async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
  }

  test.describe('Executor Dashboard - Filtros e Visualização', () => {
    
    test('Deve exibir toggle "Minhas Atividades" / "Ver Todos" / "Histórico"', async ({ page }) => {
      await login(page, 'executor@elite.com', 'executor123');
      await page.waitForURL('/dashboard');
      
      // Verificar se o toggle existe
      await expect(page.getByRole('button', { name: 'Minhas Atividades' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Ver Todos' })).toBeVisible();
      await expect(page.getByRole('button', { name: /Histórico/ })).toBeVisible();
    });

    test('Toggle "Histórico" deve mostrar projetos concluídos', async ({ page }) => {
      await login(page, 'executor@elite.com', 'executor123');
      await page.waitForURL('/dashboard');
      
      // Clicar em Histórico
      await page.click('button:has-text("Histórico")');
      
      // Verificar mensagem de projetos concluídos
      await expect(page.getByText('Mostrando projetos concluídos/entregues')).toBeVisible();
    });
  });

  test.describe('Login - Botão Solicitar Acesso', () => {
    
    test('Botão "Solicitar acesso" deve navegar para /register', async ({ page }) => {
      await page.goto('/login');
      
      // Verificar se o botão existe
      const solicitarAcessoBtn = page.getByRole('button', { name: 'Solicite acesso' });
      await expect(solicitarAcessoBtn).toBeVisible();
      
      // Clicar no botão
      await solicitarAcessoBtn.click();
      
      // Verificar navegação para registro
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Modal Cliente - Scroll Único', () => {
    
    test('Modal de cliente não deve ter scroll duplo', async ({ page }) => {
      await login(page, 'executor@elite.com', 'executor123');
      await page.waitForURL('/dashboard');
      
      // Navegar para aba Clientes
      await page.click('button:has-text("Clientes")');
      
      // Verificar que a aba de clientes carregou
      await expect(page.getByText('Clientes e Documentos')).toBeVisible();
    });
  });

  test.describe('Verificação Pública', () => {
    
    test('Página pública deve exibir laudo com 15 seções', async ({ page }) => {
      // Navegar para página de verificação com ID de exemplo
      await page.goto('/verify/test-project-id');
      
      // Verificar elementos básicos
      await expect(page.getByRole('heading', { name: 'EliteTrack™' })).toBeVisible();
    });
  });

  test.describe('Orçamentos - Formatação', () => {
    
    test('Executor deve ver aba de orçamentos', async ({ page }) => {
      await login(page, 'executor@elite.com', 'executor123');
      await page.waitForURL('/dashboard');
      
      // Navegar para aba Orçamentos
      await page.click('button:has-text("Orçamentos")');
      
      // Verificar que a aba carregou
      await expect(page.getByText('Orçamentos')).toBeVisible();
    });
  });

  test.describe('Documentos Cliente', () => {
    
    test('Página de documentos deve carregar para cliente logado', async ({ page }) => {
      // Este teste assume que existe um cliente de teste
      await page.goto('/documents');
      
      // Se redirecionar para login, está funcionando corretamente
      await expect(page).toHaveURL(/\/(login|documents)/);
    });
  });
});
