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
// Bottom Bar — Labels do Perfil App Cliente
// ──────────────────────────────────────────────

test.describe('Bottom Bar — Labels Cliente (Desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('exibe labels "Painel", "Etapas" e "Galeria"', async ({ page }) => {
    const nav = page.locator('nav').last()
    await expect(nav.locator('text=Painel')).toBeVisible()
    await expect(nav.locator('text=Etapas')).toBeVisible()
    await expect(nav.locator('text=Galeria')).toBeVisible()
  })

  test('labels antigos não aparecem', async ({ page }) => {
    const nav = page.locator('nav').last()
    await expect(nav.locator('text=Início')).not.toBeVisible()
    await expect(nav.locator('text=Timeline')).not.toBeVisible()
  })

  test('navegação funcional ao clicar em cada label', async ({ page }) => {
    const nav = page.locator('nav').last()

    await nav.locator('text=Etapas').click()
    await expect(page).toHaveURL(/\/timeline/)

    await nav.locator('text=Galeria').click()
    await expect(page).toHaveURL(/\/gallery/)

    await nav.locator('text=Painel').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Bottom Bar — Labels Cliente (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await loginAsClient(page)
  })

  test('exibe labels corretos no mobile', async ({ page }) => {
    const nav = page.locator('nav').last()
    await expect(nav.locator('text=Painel')).toBeVisible()
    await expect(nav.locator('text=Etapas')).toBeVisible()
    await expect(nav.locator('text=Galeria')).toBeVisible()
  })

  test('labels antigos não aparecem no mobile', async ({ page }) => {
    const nav = page.locator('nav').last()
    await expect(nav.locator('text=Início')).not.toBeVisible()
    await expect(nav.locator('text=Timeline')).not.toBeVisible()
  })

  test('navegação funcional no mobile', async ({ page }) => {
    const nav = page.locator('nav').last()

    await nav.locator('text=Etapas').click()
    await expect(page).toHaveURL(/\/timeline/)

    await nav.locator('text=Galeria').click()
    await expect(page).toHaveURL(/\/gallery/)

    await nav.locator('text=Painel').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
