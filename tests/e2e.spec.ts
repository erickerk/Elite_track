import { test, expect, type Page } from '@playwright/test';
import { Buffer } from 'buffer';

test.describe.serial('Elite Track - Varredura E2E', () => {
  const uniqueId = Date.now().toString();
  const clientName = `Cliente Teste ${uniqueId}`;
  const clientEmail = `cliente${uniqueId}@teste.com`;
  const clientPhone = `(11) 99999-${uniqueId.slice(-4)}`;
  const vehicleBrand = 'Toyota';
  const vehicleModel = `Corolla ${uniqueId.slice(-3)}`;
  const vehiclePlate = `TST-${uniqueId.slice(-4)}`;

  const png1x1Base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5w0h8AAAAASUVORK5CYII=';

  let createdProjectId: string;
  let tempPassword: string;

  async function login(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
  }

  test('Fluxo completo: Executor -> Criar Projeto -> QR Lookup -> Público/PDF -> Cliente (senha temporária + troca de senha)', async ({ page }) => {
    test.setTimeout(180000);

    // Login executor
    await login(page, 'executor@elite.com', 'executor123');
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'EliteTrack™' })).toBeVisible();
    await expect(page.getByText('Painel de Projetos').first()).toBeVisible();

    // Abrir modal de cadastro
    await page.click('button:has-text("Novo Projeto")');
    await expect(page.getByText('Cadastrar Novo Veículo')).toBeVisible();

    // Preencher cliente
    await page.fill('input[title="Nome do cliente"]', clientName);
    await page.fill('input[title="E-mail do cliente"]', clientEmail);
    await page.fill('input[title="Telefone do cliente"]', clientPhone);

    // Preencher veículo
    await page.fill('input[title="Marca do veículo"]', vehicleBrand);
    await page.fill('input[title="Modelo do veículo"]', vehicleModel);
    await page.fill('input[title="Ano do veículo"]', '2024');
    await page.fill('input[title="Placa do veículo"]', vehiclePlate);
    await page.fill('input[title="Cor do veículo"]', 'Preto');

    // Upload foto (obrigatória)
    await page.setInputFiles('input[title="Selecionar foto do veículo"]', {
      name: 'car.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png1x1Base64, 'base64'),
    });

    // Criar projeto
    const createBtn = page.locator('button:has-text("Criar Projeto")').first();
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click();

    // Modal de compartilhamento
    await expect(page.getByText('PROJETO CRIADO!')).toBeVisible();
    await expect(page.getByText(clientName).first()).toBeVisible();
    await expect(page.getByText(`${vehicleBrand} ${vehicleModel}`).first()).toBeVisible();

    // Rolar até a seção de dados de acesso e capturar senha temporária
    const tempPasswordLabel = page.locator('span:text("Senha temporária:")');
    await tempPasswordLabel.scrollIntoViewIfNeeded();
    
    // A senha está no span irmão com classes font-mono + text-primary (única ocorrência)
    tempPassword = (await tempPasswordLabel
      .locator('xpath=following-sibling::span')
      .first()
      .innerText()).trim();

    expect(tempPassword).toMatch(/^\d{4}$/);

    // Fechar modal
    await page.click('button:has-text("Fechar")');

    // Esperar persistência do ProjectContext
    await page.waitForTimeout(700);

    // Pegar projectId do localStorage correto
    createdProjectId = await page.evaluate((plate) => {
      const normalize = (s: string) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const stored = JSON.parse(localStorage.getItem('elitetrack_projects') || '[]');
      const found = stored.find((p: any) => normalize(p?.vehicle?.plate) === normalize(plate));
      return found?.id || '';
    }, vehiclePlate);

    expect(createdProjectId).toBeTruthy();

    // Abrir QR por placa e validar reenviar/baixar
    await page.click('button:has-text("QR por Placa")');
    await expect(page.getByText('Consultar QR Codes')).toBeVisible();
    await page.fill('input[placeholder="ABC-1D23"]', vehiclePlate);
    await page.click('button:has-text("Buscar")');
    await expect(page.getByText('PROJETO ENCONTRADO!')).toBeVisible();
    await expect(page.getByText('Baixar QR Cadastro')).toBeVisible();
    await expect(page.getByText('Baixar QR Projeto')).toBeVisible();
    await expect(page.getByText('WhatsApp')).toBeVisible();
    await expect(page.getByText('E-mail')).toBeVisible();

    // Validar download de QR (projeto)
    const [qrDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.click('button:has-text("Baixar QR Projeto")'),
    ]);
    expect(qrDownload.suggestedFilename()).toContain('QR-Projeto-');

    // Fechar QR lookup
    await page.click('button[title="Fechar"]');

    // Página pública + PDF
    await page.goto(`/verify/${createdProjectId}`);
    await expect(page.getByRole('heading', { name: 'EliteTrack™' })).toBeVisible();
    await expect(page.getByText('Verificação de Autenticidade')).toBeVisible();
    await expect(page.getByText('Placa do Veículo').first()).toBeVisible();
    await expect(page.getByText(vehiclePlate).first()).toBeVisible();

    // Geração de PDF (valida download + estado do botão)
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download', { timeout: 20000 }),
      page.click('button[title="Baixar em PDF"]'),
    ]);
    expect(pdfDownload.suggestedFilename()).toContain(`EliteTrack-Laudo-${createdProjectId}`);

    // Logout executor
    await page.goto('/dashboard');
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL('/login');

    // Login cliente com senha temporária (deve ir para trocar senha)
    await login(page, clientEmail, tempPassword);
    await page.waitForURL('/change-password');
    await expect(page.getByText('Altere sua Senha')).toBeVisible();

    // Trocar senha
    const newClientPassword = `NovaSenha1${uniqueId.slice(-2)}`;
    await page.fill('input[placeholder="Digite sua nova senha"]', newClientPassword);
    await page.fill('input[placeholder="Confirme sua nova senha"]', newClientPassword);
    await page.click('button:has-text("Salvar Nova Senha")');

    await expect(page.getByText('Senha Alterada!')).toBeVisible();
    await page.waitForURL('/dashboard');

    // Smoke: dashboard cliente abre
    await expect(page.locator('header').getByText('EliteTrack™').first()).toBeVisible();
    await expect(page.getByText(vehiclePlate).first()).toBeVisible();
  });
});
