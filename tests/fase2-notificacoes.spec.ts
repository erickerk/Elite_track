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
// Fase 2 — Notificações: sino abre painel (não navega)
// ──────────────────────────────────────────────

test.describe('Fase 2 — Sino de Notificações (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('sino de notificações existe no header', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Notificações' })).toBeVisible()
  })

  test('clicar no sino NÃO navega para outra página', async ({ page }) => {
    const currentUrl = page.url()
    await page.getByRole('button', { name: 'Notificações' }).click()
    // Deve permanecer na mesma URL (dashboard)
    await expect(page).toHaveURL(currentUrl)
  })

  test('clicar no sino abre painel de notificações', async ({ page }) => {
    await page.getByRole('button', { name: 'Notificações' }).click()
    // NotificationPanel deve aparecer com título ou lista de notificações
    await expect(page.locator('text=Notificações').first()).toBeVisible()
  })
})

test.describe('Fase 2 — Sino de Notificações (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('sino de notificações existe no header mobile', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Notificações' })).toBeVisible()
  })

  test('clicar no sino NÃO navega no mobile', async ({ page }) => {
    const currentUrl = page.url()
    await page.getByRole('button', { name: 'Notificações' }).click()
    await expect(page).toHaveURL(currentUrl)
  })

  test('clicar no sino abre painel no mobile', async ({ page }) => {
    await page.getByRole('button', { name: 'Notificações' }).click()
    await expect(page.locator('text=Notificações').first()).toBeVisible()
  })
})
