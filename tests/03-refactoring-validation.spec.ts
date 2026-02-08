import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:5175'

const IGNORED = ['ResizeObserver', 'Failed to fetch', 'Cannot read properties']
const isIgnored = (msg: string) => IGNORED.some(e => msg.includes(e))

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('textbox').first().fill('erick@teste.com')
  await page.locator('input[type="password"]').fill('Teste@2025')
  await page.getByRole('button', { name: /entrar|login/i }).click()
  await page.waitForURL(/dashboard|splash/, { timeout: 15000 })
  if (page.url().includes('splash')) await page.waitForURL(/dashboard/, { timeout: 10000 })
}

// FASE 1: Consulta Pública Segura
test.describe('Consulta Publica Segura', () => {
  test('Rota /verify carrega', async ({ page }) => {
    await page.goto(`${BASE}/verify/f7c116dc-6f74-4beb-866f-440d9598d6a3`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).toBeVisible()
    const c = await page.getByText(/EliteShield|Verificação|Não Encontrado|Autêntic/i).count()
    expect(c).toBeGreaterThan(0)
  })

  test('Nao vaza email', async ({ page }) => {
    await page.goto(`${BASE}/verify/f7c116dc-6f74-4beb-866f-440d9598d6a3`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const html = await page.content()
    expect(html).not.toContain('erick@teste.com')
    expect(html).not.toContain('executor@')
  })

  test('Nao vaza telefone', async ({ page }) => {
    await page.goto(`${BASE}/verify/f7c116dc-6f74-4beb-866f-440d9598d6a3`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const html = await page.content()
    expect(html).not.toContain('executor_id')
  })

  test('/laudo-completo requer auth', async ({ page }) => {
    await page.goto(`${BASE}/laudo-completo/test-id`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })
})

// FASE 3: Bugs Perfil Cliente
test.describe('Bugs Perfil Cliente', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('Timeline sem loop infinito', async ({ page }) => {
    const errors: string[] = []
    page.on('console', m => { if (m.type() === 'error' && m.text().includes('Maximum update depth')) errors.push(m.text()) })
    await page.goto(`${BASE}/timeline`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    expect(errors.length).toBe(0)
  })

  test('Chat sem 15 min', async ({ page }) => {
    await page.goto(`${BASE}/chat`)
    await page.waitForLoadState('networkidle')
    expect(await page.content()).not.toContain('Resposta em até 15 min')
  })

  test('Drawer sem secao Principal duplicada', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Abrir menu').click()
    await page.waitForTimeout(500)
    const t = await page.locator('aside').textContent() || ''
    expect(t).toContain('Meu Veículo')
    expect(await page.locator('aside').getByText('Principal', { exact: true }).count()).toBe(0)
  })

  test('Numero suporte correto', async ({ page }) => {
    await page.goto(`${BASE}/elite-card`)
    await page.waitForLoadState('networkidle')
    const html = await page.content()
    expect(html).not.toContain('3456-7890')
  })

  test('Bottom nav 5 itens', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('nav.fixed.bottom-0 button')).toHaveCount(5)
  })
})

// FASE 4: Mobile Layout
test.describe('Mobile Layout 375px', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await login(page)
  })

  test('Dashboard sem overflow', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const o = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(o).toBeFalsy()
  })

  test('Timeline sem overflow', async ({ page }) => {
    await page.goto(`${BASE}/timeline`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const o = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(o).toBeFalsy()
  })

  test('Scroll-to-top no bottom nav', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(500)
    const before = await page.evaluate(() => window.scrollY)
    await page.locator('nav.fixed.bottom-0 button').first().click()
    await page.waitForTimeout(1500)
    const after = await page.evaluate(() => window.scrollY)
    expect(after).toBeLessThan(before)
  })
})
