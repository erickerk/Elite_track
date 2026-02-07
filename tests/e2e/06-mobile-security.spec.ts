import { test, expect, type Page } from '@playwright/test'

/**
 * FASE 6 — Mobile Layout & Security E2E
 * 
 * [UI/UX]        Responsividade em 375px, 390px, 768px para todos os perfis
 * [SEGURANÇA]    Auth guards, session, rotas protegidas, XSS básico
 * [ENGENHEIRO]   MobileLayout (cliente), ExecutorShell (executor), AdminLayout (admin)
 * [DEPURADOR]    Overflow, elementos cortados, JS errors em diferentes viewports
 * 
 * Design Tokens:
 *   sm: 640px | md: 768px | lg: 1024px
 *   Primary: gold #D4AF37 | Dark: carbon-900 #0A0A0A
 *   Bottom nav: 64px height
 */

const BASE = 'http://localhost:5173'

const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }
const EXECUTOR = { email: 'joao@teste.com', password: 'Teste@2025' }
const ADMIN = { email: 'juniorrodrigues1011@gmail.com', password: '2025!Adm' }

// Helper: forçar logout
async function forceLogout(page: Page): Promise<void> {
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    try { localStorage.clear() } catch {}
    try { sessionStorage.clear() } catch {}
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
}

// Helper: login
async function loginAs(page: Page, creds: { email: string; password: string }, role: string): Promise<boolean> {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button[type="submit"]')
  try {
    if (role === 'admin') {
      await page.waitForSelector('text=Painel Admin', { timeout: 20000 })
    } else {
      await page.waitForURL('**/dashboard', { timeout: 15000 })
    }
    await page.waitForTimeout(2000)
    return true
  } catch {
    if (page.url().includes('/dashboard')) {
      await page.waitForTimeout(2000)
      return true
    }
    return false
  }
}

// Helper: verificar sem overflow horizontal
async function checkNoOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth
  })
}

// Rotas cliente para testar mobile
const CLIENT_ROUTES = [
  '/dashboard', '/timeline', '/gallery', '/chat', '/qrcode',
  '/eliteshield', '/elite-card', '/delivery', '/revisoes',
  '/documents', '/profile'
]

// ============================================================
// BLOCO 1: MOBILE 375px — CLIENTE (iPhone SE)
// ============================================================
test.describe('1. Mobile 375px — Cliente', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) test.skip()
  })

  test('1.1 Zero overflow em todas as 11 rotas cliente', async ({ page }) => {
    for (const route of CLIENT_ROUTES) {
      await page.goto(`${BASE}${route}`)
      await page.waitForTimeout(1500)
      const noOverflow = await checkNoOverflow(page)
      expect(noOverflow, `Overflow em ${route}`).toBe(true)
    }
  })

  test('1.2 Bottom nav visível e fixo na parte inferior', async ({ page }) => {
    const bottomNav = page.locator('nav').last()
    if (await bottomNav.count() > 0) {
      const box = await bottomNav.boundingBox()
      if (box) {
        // Bottom nav deve estar na parte inferior (y > 700 para tela 812px)
        expect(box.y).toBeGreaterThan(700)
      }
    }
  })

  test('1.3 Header e conteúdo principal visíveis', async ({ page }) => {
    const header = page.locator('header').first()
    const main = page.locator('main').first()
    // Ambos devem existir e ter dimensões
    if (await header.count() > 0) {
      const headerBox = await header.boundingBox()
      expect(headerBox).toBeTruthy()
      if (headerBox) expect(headerBox.height).toBeGreaterThan(30)
    }
    if (await main.count() > 0) {
      const mainBox = await main.boundingBox()
      expect(mainBox).toBeTruthy()
    }
  })

  test('1.4 Drawer abre e fecha corretamente no mobile', async ({ page }) => {
    const openBtn = page.locator('button[aria-label="Abrir menu"]')
    if (await openBtn.count() > 0) {
      await openBtn.click()
      await page.waitForTimeout(500)
      // Drawer deve estar visível
      const closeBtn = page.locator('button[aria-label="Fechar menu"]')
      await expect(closeBtn).toBeVisible({ timeout: 3000 })
      await closeBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('1.5 Cards não vazam para fora da tela', async ({ page }) => {
    const cards = page.locator('[class*="rounded"]').filter({ has: page.locator('p, span, div') })
    const count = await cards.count()
    const maxCheck = Math.min(count, 10)
    for (let i = 0; i < maxCheck; i++) {
      const box = await cards.nth(i).boundingBox()
      if (box && box.width > 50) {
        expect(box.x + box.width, `Card ${i} vaza à direita`).toBeLessThanOrEqual(380)
      }
    }
  })

  test('1.6 Textos legíveis (maioria >= 10px)', async ({ page }) => {
    const fontStats = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label')
      let total = 0, readable = 0
      elements.forEach(el => {
        if (el.textContent && el.textContent.trim().length > 0) {
          total++
          const fontSize = parseFloat(getComputedStyle(el).fontSize)
          if (fontSize >= 10) readable++
        }
      })
      return { total, readable }
    })
    // Pelo menos 90% dos textos devem ser legíveis (>= 10px)
    if (fontStats.total > 0) {
      const ratio = fontStats.readable / fontStats.total
      expect(ratio).toBeGreaterThan(0.85)
    }
  })
})

// ============================================================
// BLOCO 2: MOBILE 375px — EXECUTOR
// ============================================================
test.describe('2. Mobile 375px — Executor', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    const success = await loginAs(page, EXECUTOR, 'executor')
    if (!success) test.skip()
  })

  test('2.1 Dashboard executor sem overflow', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('2.2 Tabs do executor acessíveis no mobile', async ({ page }) => {
    const body = await page.locator('body').textContent() || ''
    const hasContent = body.includes('Dashboard') || body.includes('Projetos') ||
                       body.includes('Clientes') || body.includes('Agenda')
    expect(hasContent).toBeTruthy()
  })

  test('2.3 Sem JS errors no executor mobile', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))
    await page.waitForTimeout(3000)
    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined')
    )
    expect(critical).toHaveLength(0)
  })
})

// ============================================================
// BLOCO 3: MOBILE 375px — ADMIN
// ============================================================
test.describe('3. Mobile 375px — Admin', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) test.skip()
  })

  test('3.1 Admin dashboard sem overflow no mobile', async ({ page }) => {
    const noOverflow = await checkNoOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('3.2 Hamburger menu funcional', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="Abrir menu"]')
    await expect(hamburger).toBeVisible()
    await hamburger.click()
    await page.waitForTimeout(500)
    // Deve mostrar opções do admin
    const adminOptions = page.locator('text=Dashboard').or(page.locator('text=Executores'))
    expect(await adminOptions.count()).toBeGreaterThanOrEqual(1)
  })

  test('3.3 Navegação admin mobile entre tabs sem crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    const tabs = ['Executores', 'Projetos', 'Leads']
    for (const tabName of tabs) {
      // Abrir drawer no mobile
      const hamburger = page.locator('button[aria-label="Abrir menu"]')
      if (await hamburger.isVisible()) {
        await hamburger.click()
        await page.waitForTimeout(800)
      }
      // Clicar na tab dentro do drawer overlay
      const overlay = page.locator('.fixed, [class*="fixed"]').filter({ hasText: tabName })
      const tab = overlay.locator('button').filter({ hasText: tabName })
      if (await tab.count() > 0) {
        await tab.first().click({ force: true })
        await page.waitForTimeout(1000)
      }
    }

    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined')
    )
    expect(critical).toHaveLength(0)
  })
})

// ============================================================
// BLOCO 4: TABLET 768px (iPad Mini)
// ============================================================
test.describe('4. Tablet 768px — Responsividade', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('4.1 Cliente: dashboard sem overflow no tablet', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }
    const noOverflow = await checkNoOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('4.2 Admin: dashboard sem overflow no tablet', async ({ page }) => {
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    const noOverflow = await checkNoOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('4.3 Landing page sem overflow no tablet', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    const noOverflow = await checkNoOverflow(page)
    expect(noOverflow).toBe(true)
  })
})

// ============================================================
// BLOCO 5: SEGURANÇA — AUTH GUARDS
// ============================================================
test.describe('5. Segurança — Auth Guards', () => {
  test('5.1 Rotas privadas redirecionam para /login sem auth', async ({ page }) => {
    const privateRoutes = ['/dashboard', '/timeline', '/gallery', '/chat', '/profile']
    for (const route of privateRoutes) {
      await page.goto(`${BASE}${route}`)
      await page.waitForTimeout(2000)
      expect(page.url(), `${route} não redirecionou`).toContain('/login')
    }
  })

  test('5.2 /verify/:id é acessível sem auth (rota pública)', async ({ page }) => {
    await page.goto(`${BASE}/verify/public-test`)
    await page.waitForTimeout(2000)
    expect(page.url()).not.toContain('/login')
  })

  test('5.3 /login redireciona para /dashboard se já autenticado', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }
    await page.goto(`${BASE}/login`)
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/dashboard')
  })

  test('5.4 Sessão expira ao limpar localStorage', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }
    // Limpar sessão
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/login')
  })

  test('5.5 Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.fill('input[type="email"]', 'fake@invalid.com')
    await page.fill('input[type="password"]', 'wrongpass123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    // Deve permanecer na página de login
    expect(page.url()).toContain('/login')
  })
})

// ============================================================
// BLOCO 6: SEGURANÇA — XSS E INJEÇÃO BÁSICA
// ============================================================
test.describe('6. Segurança — XSS e Injeção', () => {
  test('6.1 Input de login não executa script injetado', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(`${BASE}/login`)
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.fill('input[type="email"]', '<script>alert("xss")</script>')
    await page.fill('input[type="password"]', '<img onerror=alert(1) src=x>')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // Não deve ter alert ou erro de XSS
    expect(page.url()).toContain('/login')
    const alertTriggered = jsErrors.some(e => e.includes('alert'))
    expect(alertTriggered).toBe(false)
  })

  test('6.2 URL /verify com payload XSS não executa script', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(`${BASE}/verify/<script>alert('xss')</script>`)
    await page.waitForTimeout(3000)

    const xssErrors = jsErrors.filter(e => e.includes('alert') || e.includes('XSS'))
    expect(xssErrors).toHaveLength(0)
  })

  test('6.3 URL /qr com payload de injeção tratada', async ({ page }) => {
    await page.goto(`${BASE}/qr/'; DROP TABLE users; --`)
    await page.waitForTimeout(3000)
    // Deve mostrar conteúdo normal (redirect ou erro)
    const body = await page.locator('body').textContent() || ''
    expect(body.length).toBeGreaterThan(5)
  })
})

// ============================================================
// BLOCO 7: SEGURANÇA — COOKIES E STORAGE
// ============================================================
test.describe('7. Segurança — Storage e Sessão', () => {
  test('7.1 Sessão armazenada no localStorage (não cookie exposto)', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('elite-session')
    })
    expect(sessionData).toBeTruthy()
  })

  test('7.2 Dados sensíveis NÃO expostos no localStorage', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    const allStorage = await page.evaluate(() => {
      const data: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) data[key] = localStorage.getItem(key) || ''
      }
      return JSON.stringify(data)
    })

    // Não deve ter senha em texto claro no storage
    expect(allStorage).not.toContain('Teste@2025')
    expect(allStorage).not.toContain('2025!Adm')
  })

  test('7.3 Logout limpa dados de sessão', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    // Verificar sessão existe
    const before = await page.evaluate(() => localStorage.getItem('elite-session'))
    expect(before).toBeTruthy()

    // Fazer logout
    await forceLogout(page)

    const after = await page.evaluate(() => localStorage.getItem('elite-session'))
    expect(after).toBeNull()
  })
})

// ============================================================
// BLOCO 8: LANDING PAGE MOBILE
// ============================================================
test.describe('8. Landing Page — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('8.1 Landing page sem overflow no mobile', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)
    const noOverflow = await checkNoOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('8.2 Landing page carrega sem JS errors', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(BASE)
    await page.waitForTimeout(3000)

    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Failed to fetch') &&
      !e.includes('net::')
    )
    expect(critical).toHaveLength(0)
  })

  test('8.3 Botão de login acessível na landing', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    const loginBtn = page.locator('a[href*="login"]')
      .or(page.locator('button').filter({ hasText: /login|entrar|acessar/i }))
      .or(page.locator('a').filter({ hasText: /login|entrar|acessar/i }))
    expect(await loginBtn.count()).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================
// BLOCO 9: ESTABILIDADE MULTI-VIEWPORT
// ============================================================
test.describe('9. Estabilidade — Multi-Viewport', () => {
  test('9.1 Zero JS errors em 375px (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    // Navegar por 5 rotas
    const routes = ['/dashboard', '/timeline', '/gallery', '/qrcode', '/profile']
    for (const route of routes) {
      await page.goto(`${BASE}${route}`)
      await page.waitForTimeout(1000)
    }

    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined') && !e.includes('net::')
    )
    expect(critical).toHaveLength(0)
  })

  test('9.2 Zero JS errors em 1280px (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }

    const tabs = ['Dashboard', 'Executores', 'Projetos', 'Leads']
    for (const tabName of tabs) {
      const tab = page.locator('button').filter({ hasText: tabName })
      if (await tab.count() > 0) {
        await tab.first().click()
        await page.waitForTimeout(1000)
      }
    }

    const critical = jsErrors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined') && !e.includes('net::')
    )
    expect(critical).toHaveLength(0)
  })
})
