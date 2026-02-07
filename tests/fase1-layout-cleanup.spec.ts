import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'

async function loginAsClient(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: 'Email' }).fill('erick@teste.com')
  await page.getByRole('textbox', { name: 'Senha' }).fill('Teste@2025')
  await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

// ──────────────────────────────────────────────
// Fase 1 — Layout Cleanup: header único + card removido
// ──────────────────────────────────────────────

test.describe('Fase 1 — Layout (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('apenas UM header visível (sem duplicação)', async ({ page }) => {
    const headers = page.locator('header')
    // MobileLayout fornece o header principal; Dashboard não deve ter outro
    await expect(headers).toHaveCount(1)
  })

  test('logo aparece uma vez no header', async ({ page }) => {
    const logos = page.locator('header img[alt="Elite Blindagens"]')
    await expect(logos).toHaveCount(1)
  })

  test('card "Status do Veículo" NÃO aparece', async ({ page }) => {
    await expect(page.locator('text=Status do Veículo')).not.toBeVisible()
  })

  test('card "Ações Rápidas" continua visível', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ações Rápidas' })).toBeVisible()
  })

  test('card "EliteTrace™ QR" continua visível', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'EliteTrace™ QR' })).toBeVisible()
  })
})

test.describe('Fase 1 — Layout (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('apenas UM header visível no mobile', async ({ page }) => {
    const headers = page.locator('header')
    await expect(headers).toHaveCount(1)
  })

  test('card "Status do Veículo" NÃO aparece no mobile', async ({ page }) => {
    await expect(page.locator('text=Status do Veículo')).not.toBeVisible()
  })

  test('bottom bar funciona no mobile', async ({ page }) => {
    await expect(page.locator('nav').last().locator('text=Painel')).toBeVisible()
    await expect(page.locator('nav').last().locator('text=Etapas')).toBeVisible()
    await expect(page.locator('nav').last().locator('text=Galeria')).toBeVisible()
  })
})
