import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'

// Helper: login como cliente
async function loginAsClient(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.getByRole('textbox', { name: 'Email' }).fill('erick@teste.com')
  await page.getByRole('textbox', { name: 'Senha' }).fill('Teste@2025')
  await page.getByRole('button', { name: 'Entrar na Plataforma' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

// ──────────────────────────────────────────────
// Card Status do Veículo — Perfil App Cliente
// ──────────────────────────────────────────────

test.describe('Card Status do Veículo (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('título exibe "Processo de blindagem"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Processo de blindagem' })).toBeVisible()
  })

  test('subtítulo exibe "Status"', async ({ page }) => {
    // O subtítulo "Status" fica logo abaixo do título "Processo de blindagem"
    const card = page.locator('h2:has-text("Processo de blindagem")').locator('..')
    await expect(card.locator('text=Status')).toBeVisible()
  })

  test('título antigo "Progresso" NÃO aparece', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Progresso', exact: true })).not.toBeVisible()
  })

  test('caixinhas "Dias" e "Restantes" NÃO aparecem no card', async ({ page }) => {
    const card = page.locator('h2:has-text("Processo de blindagem")').locator('..').locator('..').locator('..')
    await expect(card.locator('text=Dias').first()).not.toBeVisible()
    await expect(card.locator('text=Restantes')).not.toBeVisible()
  })

  test('"Entrega Prevista" continua visível', async ({ page }) => {
    await expect(page.locator('text=Entrega Prevista').first()).toBeVisible()
  })
})

test.describe('Card Status do Veículo (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('título "Processo de blindagem" visível no mobile', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Processo de blindagem' })).toBeVisible()
  })

  test('caixinhas "Dias" e "Restantes" NÃO aparecem no mobile', async ({ page }) => {
    const card = page.locator('h2:has-text("Processo de blindagem")').locator('..').locator('..').locator('..')
    await expect(card.locator('text=Dias').first()).not.toBeVisible()
    await expect(card.locator('text=Restantes')).not.toBeVisible()
  })

  test('percentual de progresso visível no mobile', async ({ page }) => {
    await expect(page.locator('text=/\\d+%/')).toBeVisible()
  })
})
