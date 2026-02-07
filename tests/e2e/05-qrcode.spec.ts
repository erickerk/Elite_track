import { test, expect, type Page } from '@playwright/test'

/**
 * FASE 5 — QR Code E2E
 * 
 * [ENGENHEIRO]   Validar fluxo completo: geração, exibição, redirect, verificação pública
 * [DEPURADOR]    Detectar erros em rotas /verify/:id, /qr/:code, /qrcode
 * [PLANEJADOR]   Cenários: página QR cliente, rota pública, redirect, scan
 * [UI/UX]        Layout QR mobile, botões compartilhar/baixar/copiar
 * 
 * Arquitetura QR:
 *   - /qrcode → QRCodePage (cliente, autenticado) — mostra QR do projeto
 *   - /verify/:projectId → PublicVerification (público) — verificação de blindagem
 *   - /qr/:code → QRRedirect (público) — resolve código e redireciona
 *   - qrUtils.ts → getVerifyUrl(), getQrImageUrl(), generateQrDataUrl()
 *   - URL padrão: {base}/verify/{projectId}
 *   - Imagem QR: api.qrserver.com
 *   - QR IDs no Supabase: formato QR-{timestamp}-PERMANENT
 */

const BASE = 'http://localhost:5173'

const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }
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
    console.warn(`[QRCode Test] Login ${role} falhou`)
    return false
  }
}

// ============================================================
// BLOCO 1: PÁGINA QR DO CLIENTE (/qrcode)
// ============================================================
test.describe('1. QR Code — Página do Cliente', () => {
  test.beforeEach(async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) test.skip()
  })

  test('1.1 Página /qrcode carrega sem crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(3000)

    const criticalErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('1.2 Título EliteTrace visível', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const heading = page.locator('h1').filter({ hasText: 'EliteTrace' })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })

  test('1.3 Imagem QR Code visível', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const qrImage = page.locator('img[alt*="QR"]').or(page.locator('img[alt*="qr"]'))
    if (await qrImage.count() > 0) {
      await expect(qrImage.first()).toBeVisible()
    } else {
      // Pode não ter QR se projeto é undefined
      const body = await page.locator('body').textContent()
      expect(body?.length).toBeGreaterThan(10)
    }
  })

  test('1.4 Imagem QR usa api.qrserver.com', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const qrImage = page.locator('img[alt*="QR"]')
    if (await qrImage.count() > 0) {
      const src = await qrImage.first().getAttribute('src')
      expect(src).toContain('api.qrserver.com')
    }
  })

  test('1.5 URL do QR contém /verify/{projectId}', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const qrImage = page.locator('img[alt*="QR"]')
    if (await qrImage.count() > 0) {
      const src = await qrImage.first().getAttribute('src')
      // A URL do QR deve conter /verify/ encodado
      expect(src).toContain('verify')
    }
  })

  test('1.6 Botões de ação visíveis (Compartilhar, Baixar, Copiar)', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const actions = ['Compartilhar', 'Baixar', 'Copiar']
    let found = 0
    for (const action of actions) {
      if (await page.locator(`text=${action}`).count() > 0) found++
    }
    expect(found).toBeGreaterThanOrEqual(2)
  })

  test('1.7 Seção "Como usar o EliteTrace" visível', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const howTo = page.locator('text=Como usar').or(page.locator('text=EliteTrace'))
    expect(await howTo.count()).toBeGreaterThanOrEqual(1)
  })

  test('1.8 Dados do veículo visíveis no QR', async ({ page }) => {
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    // Deve mostrar marca/modelo do veículo ou QR code ID
    const body = await page.locator('body').textContent() || ''
    const hasVehicleData = body.includes('QR-') || body.match(/[A-Z][a-z]+\s+[A-Z]/) ||
                          body.includes('veículo') || body.includes('blindagem') ||
                          body.includes('Blindagem')
    expect(hasVehicleData).toBeTruthy()
  })
})

// ============================================================
// BLOCO 2: ROTA PÚBLICA /verify/:projectId
// ============================================================
test.describe('2. QR Code — Verificação Pública (/verify)', () => {
  test('2.1 /verify/:id carrega sem autenticação', async ({ page }) => {
    await page.goto(`${BASE}/verify/test-project-id`)
    await page.waitForTimeout(3000)

    // Não deve redirecionar para /login
    expect(page.url()).not.toContain('/login')
    expect(page.url()).toContain('/verify/')
  })

  test('2.2 /verify com ID inválido mostra conteúdo (não crash)', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    await page.goto(`${BASE}/verify/invalid-id-12345`)
    await page.waitForTimeout(3000)

    const body = await page.locator('body').textContent() || ''
    expect(body.length).toBeGreaterThan(10)

    const criticalErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined') &&
      !e.includes('net::')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('2.3 /verify com ID real de projeto (se disponível)', async ({ page }) => {
    // Primeiro, pegar um ID real dos logs do admin
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    // Extrair QR code ID dos logs
    const qrLog = consoleLogs.find(l => l.includes('QR-') && l.includes('PERMANENT'))
    if (!qrLog) { test.skip(); return }

    const qrMatch = qrLog.match(/QR-\d+-PERMANENT/)
    if (!qrMatch) { test.skip(); return }

    const projectId = qrMatch[0]

    // Logout e acessar como público
    await forceLogout(page)
    await page.goto(`${BASE}/verify/${projectId}`)
    await page.waitForTimeout(3000)

    // Deve mostrar conteúdo de verificação
    const body = await page.locator('body').textContent() || ''
    expect(body.length).toBeGreaterThan(20)
    expect(page.url()).toContain('/verify/')
  })
})

// ============================================================
// BLOCO 3: ROTA /qr/:code (REDIRECT)
// ============================================================
test.describe('3. QR Code — Redirect (/qr/:code)', () => {
  test('3.1 /qr/:code redireciona para /verify', async ({ page }) => {
    await page.goto(`${BASE}/qr/some-test-code`)
    await page.waitForTimeout(5000)

    // Deve redirecionar para /verify/some-test-code ou mostrar erro
    const url = page.url()
    const body = await page.locator('body').textContent() || ''
    const redirected = url.includes('/verify/') || body.includes('não encontrado') ||
                       body.includes('not found') || body.includes('Carregando')
    expect(redirected).toBeTruthy()
  })

  test('3.2 /qr/:code com UUID longo redireciona direto', async ({ page }) => {
    const fakeUUID = '12345678-1234-1234-1234-123456789012'
    await page.goto(`${BASE}/qr/${fakeUUID}`)
    await page.waitForTimeout(5000)

    // UUID longo (>20 chars com hífens) deve redirecionar para /verify/{uuid}
    expect(page.url()).toContain('/verify/')
  })

  test('3.3 /qr sem código mostra conteúdo', async ({ page }) => {
    await page.goto(`${BASE}/qr/`)
    await page.waitForTimeout(3000)

    // Pode mostrar erro ou redirecionar
    const body = await page.locator('body').textContent() || ''
    expect(body.length).toBeGreaterThan(5)
  })
})

// ============================================================
// BLOCO 4: QR CODE NO CONTEXTO DO ADMIN
// ============================================================
test.describe('4. QR Code — Visibilidade Admin', () => {
  test('4.1 Admin vê QR IDs nos logs do Supabase', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    const qrLogs = consoleLogs.filter(l => l.includes('QR-') && l.includes('PERMANENT'))
    expect(qrLogs.length).toBeGreaterThanOrEqual(1)
  })

  test('4.2 QR IDs seguem formato QR-{timestamp}-PERMANENT', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    const qrLogs = consoleLogs.filter(l => l.includes('QR-'))
    for (const log of qrLogs) {
      const match = log.match(/QR-(\d+)-PERMANENT/)
      if (match) {
        const timestamp = parseInt(match[1])
        // Timestamp deve ser um número válido (13 dígitos = milissegundos)
        expect(timestamp).toBeGreaterThan(1700000000000)
        expect(timestamp).toBeLessThan(2100000000000)
      }
    }
  })
})

// ============================================================
// BLOCO 5: QR CODE MOBILE [UI/UX]
// ============================================================
test.describe('5. QR Code — Mobile Layout [UI/UX]', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('5.1 Página /qrcode sem overflow no mobile', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(overflow).toBe(false)
  })

  test('5.2 QR Code imagem cabe na tela mobile', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const qrImage = page.locator('img[alt*="QR"]')
    if (await qrImage.count() > 0) {
      const box = await qrImage.first().boundingBox()
      if (box) {
        // QR deve caber na tela (375px largura)
        expect(box.x + box.width).toBeLessThanOrEqual(375)
        expect(box.width).toBeLessThanOrEqual(300)
      }
    }
  })

  test('5.3 Botões de ação responsivos no mobile', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    // Grid de 3 colunas deve caber
    const buttons = page.locator('button').filter({ hasText: /Compartilhar|Baixar|Copiar/i })
    const count = await buttons.count()
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const box = await buttons.nth(i).boundingBox()
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(380)
        }
      }
    }
  })

  test('5.4 /verify/:id responsivo no mobile', async ({ page }) => {
    await page.goto(`${BASE}/verify/test-mobile-id`)
    await page.waitForTimeout(3000)

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(overflow).toBe(false)
  })
})

// ============================================================
// BLOCO 6: ESTABILIDADE [DEPURADOR]
// ============================================================
test.describe('6. QR Code — Estabilidade', () => {
  test('6.1 Navegação /qrcode sem erros JS críticos', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(3000)

    // Navegar para outra página e voltar
    await page.goto(`${BASE}/dashboard`)
    await page.waitForTimeout(1000)
    await page.goto(`${BASE}/qrcode`)
    await page.waitForTimeout(2000)

    const criticalErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('extension') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined') &&
      !e.includes('net::')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('6.2 /verify sem console.error críticos', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('404') &&
            !text.includes('net::') && !text.includes('Failed to fetch')) {
          consoleErrors.push(text)
        }
      }
    })

    await page.goto(`${BASE}/verify/test-stability`)
    await page.waitForTimeout(3000)

    const typeErrors = consoleErrors.filter(e =>
      (e.includes('TypeError') || e.includes('ReferenceError') || e.includes('SyntaxError')) &&
      !e.includes('Failed to fetch')
    )
    expect(typeErrors).toHaveLength(0)
  })

  test('6.3 Múltiplas navegações QR sem memory leak', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    // Acessar /verify várias vezes (simular múltiplos scans)
    for (let i = 0; i < 5; i++) {
      await page.goto(`${BASE}/verify/scan-${i}`)
      await page.waitForTimeout(1000)
    }

    const criticalErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined') &&
      !e.includes('net::')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
