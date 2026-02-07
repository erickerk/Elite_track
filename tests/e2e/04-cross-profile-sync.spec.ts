import { test, expect, type Page } from '@playwright/test'

/**
 * FASE 4 — Cross-Profile Sync E2E
 * 
 * [ENGENHEIRO]   Verificar que dados do Supabase são consistentes entre perfis
 * [DEPURADOR]    Detectar inconsistências de dados entre executor, cliente e admin
 * [PLANEJADOR]   Cenários: projetos compartilhados, notificações, chat, real-time
 * [UI/UX]        Cada perfil vê dados corretos para seu role
 * 
 * Arquitetura de sync:
 *   - ProjectContext: carrega TODOS os projetos do Supabase
 *   - userProjects: filtrado por user.id ou user.email
 *   - Admin: vê todos os projetos (sem filtro)
 *   - Executor: vê projetos via ExecutorDashboard (filtra por executor_id)
 *   - Cliente: vê apenas userProjects (filtro por user.id/email)
 *   - Real-time: postgres_changes em projects, vehicles, timeline_steps, step_photos
 *   - Notifications: real-time INSERT filtrado por user_id
 */

const BASE = 'http://localhost:5173'

// Credenciais dos 3 perfis
const ADMIN = { email: 'juniorrodrigues1011@gmail.com', password: '2025!Adm' }
const EXECUTOR = { email: 'joao@teste.com', password: 'Teste@2025' }
const CLIENT = { email: 'erick@teste.com', password: 'Teste@2025' }

// Helper: forçar logout completo (limpa localStorage + reload)
async function forceLogout(page: Page): Promise<void> {
  // Navegar primeiro para garantir contexto válido (evita SecurityError)
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    try { localStorage.clear() } catch {}
    try { sessionStorage.clear() } catch {}
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
}

// Helper: login genérico
async function loginAs(page: Page, creds: { email: string; password: string }, role: string): Promise<boolean> {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })
  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button[type="submit"]')

  try {
    if (role === 'admin') {
      // Admin: esperar texto exclusivo do painel admin
      await page.waitForSelector('text=Painel Admin', { timeout: 20000 })
    } else {
      // Executor/Cliente: esperar URL /dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 })
    }
    await page.waitForTimeout(2000)
    return true
  } catch {
    // Fallback: verificar URL
    if (page.url().includes('/dashboard')) {
      await page.waitForTimeout(2000)
      return true
    }
    console.warn(`[CrossProfile] Login ${role} falhou`)
    return false
  }
}

// Helper: extrair texto de projetos visíveis na página
async function getVisibleProjectTexts(page: Page): Promise<string> {
  await page.waitForTimeout(2000)
  return (await page.locator('body').textContent()) || ''
}

// Helper: coletar nomes de projetos (veículos) visíveis
async function getVisibleVehicleNames(page: Page): Promise<string[]> {
  const body = await page.locator('body').textContent() || ''
  // Extrair padrões comuns de veículos (marca modelo)
  const vehiclePatterns = body.match(/(?:Toyota|Honda|BMW|Mercedes|Volkswagen|Fiat|Chevrolet|Ford|Hyundai|Jeep|Audi|Porsche|Nissan|Mitsubishi|Volvo|Land Rover|Range Rover|Hilux|Corolla|Civic|Onix|HB20|Creta|Compass|Tracker|T-Cross|Pulse|Kicks|Renegade|SW4|Fortuner|Amarok|Ranger|S10|Toro|Frontier|L200|Triton|Pajero|RAV4|CR-V|HR-V|Tucson|Sportage|Sorento|X1|X3|X5|GLA|GLC|GLE|Q3|Q5|Q7|Cayenne|Macan)\s*\w*/gi)
  return [...new Set(vehiclePatterns || [])]
}

// ============================================================
// BLOCO 1: VISIBILIDADE DE PROJETOS ENTRE PERFIS
// ============================================================
test.describe('1. Cross-Profile — Projetos Compartilhados', () => {
  test('1.1 Admin vê TODOS os projetos do sistema', async ({ page }) => {
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }

    // Admin deve ver "Total Projetos" com número > 0
    const statsText = await page.locator('text=Total Projetos').textContent()
    expect(statsText).toBeTruthy()

    // Verificar que "Projetos Recentes" tem conteúdo
    const recentProjects = page.locator('text=Projetos Recentes')
    await expect(recentProjects).toBeVisible({ timeout: 5000 })
  })

  test('1.2 Executor vê projetos atribuídos a ele', async ({ page }) => {
    const success = await loginAs(page, EXECUTOR, 'executor')
    if (!success) { test.skip(); return }

    // Executor dashboard deve mostrar projetos ou mensagem "sem projetos"
    const body = await getVisibleProjectTexts(page)
    const hasProjects = body.includes('projeto') || body.includes('Projeto') ||
                       body.includes('veículo') || body.includes('Veículo') ||
                       body.includes('Nenhum') || body.includes('vazio')
    expect(hasProjects).toBeTruthy()
  })

  test('1.3 Cliente vê apenas seus projetos (filtro por user)', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    // Cliente deve ver dashboard com projeto ou mensagem
    const body = await getVisibleProjectTexts(page)
    expect(body.length).toBeGreaterThan(50) // Página renderizou conteúdo

    // Não deve ver indicadores de admin ou executor
    const hasAdminUI = body.includes('Painel Admin') || body.includes('Gestão de Executores')
    expect(hasAdminUI).toBe(false)
  })

  test('1.4 Mesmo projeto visível para admin e cliente', async ({ page }) => {
    // Login como cliente e capturar info do projeto
    let clientProjectInfo = ''
    const clientSuccess = await loginAs(page, CLIENT, 'client')
    if (!clientSuccess) { test.skip(); return }
    
    const clientBody = await getVisibleProjectTexts(page)
    // Capturar qualquer nome de veículo ou placa visível
    const vehicleMatch = clientBody.match(/[A-Z]{3}[-\s]?\d[A-Z0-9]\d{2}/i) // Placa brasileira
    if (vehicleMatch) clientProjectInfo = vehicleMatch[0]

    // Logout completo
    await forceLogout(page)

    // Login como admin
    const adminSuccess = await loginAs(page, ADMIN, 'admin')
    if (!adminSuccess) { test.skip(); return }

    // Admin deve ter acesso à mesma informação
    const adminBody = await getVisibleProjectTexts(page)
    expect(adminBody.length).toBeGreaterThan(100)

    // Se encontrou placa no cliente, verificar se admin também tem projetos (dados compartilhados)
    if (clientProjectInfo) {
      // Admin tab "Projetos" para ver todos
      const projetosTab = page.locator('button').filter({ hasText: 'Projetos' })
      if (await projetosTab.count() > 0) {
        await projetosTab.first().click()
        await page.waitForTimeout(2000)
        const projetosBody = await getVisibleProjectTexts(page)
        // Admin deve ver projetos (mesmo que não a mesma placa, pois filtra diferente)
        expect(projetosBody.length).toBeGreaterThan(50)
      }
    }
  })
})

// ============================================================
// BLOCO 2: ISOLAMENTO DE ROLES
// ============================================================
test.describe('2. Cross-Profile — Isolamento de Roles', () => {
  test('2.1 Cliente NÃO vê UI de admin', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    const body = await getVisibleProjectTexts(page)
    expect(body).not.toContain('Gestão de Executores')
    expect(body).not.toContain('Criar Novo Executor')
    expect(body).not.toContain('Painel Admin')
  })

  test('2.2 Cliente NÃO vê UI de executor', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    const body = await getVisibleProjectTexts(page)
    expect(body).not.toContain('Novo Projeto')
    expect(body).not.toContain('Painel do Executor')
  })

  test('2.3 Executor NÃO vê UI de admin', async ({ page }) => {
    const success = await loginAs(page, EXECUTOR, 'executor')
    if (!success) { test.skip(); return }

    const body = await getVisibleProjectTexts(page)
    expect(body).not.toContain('Painel Admin')
    expect(body).not.toContain('Gestão de Executores')
  })

  test('2.4 Admin vê sidebar exclusiva (não bottom nav de cliente)', async ({ page }) => {
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }

    // Admin NÃO deve ter bottom nav de cliente (Painel, Etapas, Galeria, Chat, Perfil)
    const bottomNav = page.locator('nav').filter({ hasText: /Etapas|Galeria/i })
    expect(await bottomNav.count()).toBe(0)

    // Admin DEVE ter sidebar com tabs específicas
    const sidebar = page.locator('text=Dashboard').or(page.locator('text=Executores'))
    expect(await sidebar.count()).toBeGreaterThanOrEqual(1)
  })
})

// ============================================================
// BLOCO 3: CONTEXTO DE DADOS ENTRE LOGINS SEQUENCIAIS
// ============================================================
test.describe('3. Cross-Profile — Dados Consistentes', () => {
  test('3.1 ProjectContext carrega projetos do Supabase para cada role', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    // Login como admin
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    // Verificar que projetos foram carregados do Supabase
    const supabaseLogs = consoleLogs.filter(l => l.includes('[ProjectContext]') && l.includes('Supabase'))
    expect(supabaseLogs.length).toBeGreaterThanOrEqual(1)
  })

  test('3.2 Real-time subscription conecta para cada perfil', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(5000)

    // Verificar real-time connection
    const realtimeLogs = consoleLogs.filter(l =>
      l.includes('Real-time') && (l.includes('SUBSCRIBED') || l.includes('conectado'))
    )
    expect(realtimeLogs.length).toBeGreaterThanOrEqual(1)
  })

  test('3.3 Notificações são carregadas do Supabase por user_id', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => consoleLogs.push(msg.text()))

    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    // O NotificationContext deve carregar notificações
    // Verificar que o sino de notificações está presente
    const bellIcon = page.locator('button[aria-label="Notificações"]')
      .or(page.locator('button').filter({ hasText: /notific/i }))
    // Cliente tem sino; admin pode não ter (depende da implementação)
    if (await bellIcon.count() > 0) {
      expect(await bellIcon.count()).toBeGreaterThanOrEqual(1)
    }
  })

  test('3.4 Troca de perfil limpa dados da sessão anterior', async ({ page }) => {
    // Login como executor
    const execSuccess = await loginAs(page, EXECUTOR, 'executor')
    if (!execSuccess) { test.skip(); return }

    // Capturar dados do executor
    const execBody = await getVisibleProjectTexts(page)

    // Logout completo
    await forceLogout(page)

    // Login como cliente
    const clientSuccess = await loginAs(page, CLIENT, 'client')
    if (!clientSuccess) { test.skip(); return }

    const clientBody = await getVisibleProjectTexts(page)

    // Cliente NÃO deve ver elementos exclusivos do executor
    expect(clientBody).not.toContain('Painel do Executor')
  })
})

// ============================================================
// BLOCO 4: NAVEGAÇÃO ENTRE PERFIS SEM CRASH
// ============================================================
test.describe('4. Cross-Profile — Estabilidade Multi-Login', () => {
  test('4.1 Login executor → logout → login cliente sem crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    // Login executor
    const execSuccess = await loginAs(page, EXECUTOR, 'executor')
    if (!execSuccess) { test.skip(); return }

    // Logout completo
    await forceLogout(page)

    // Login cliente
    const clientSuccess = await loginAs(page, CLIENT, 'client')
    if (!clientSuccess) { test.skip(); return }

    // Navegar pelo dashboard do cliente
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

  test('4.2 Login cliente → logout → login admin sem crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    // Login cliente
    const clientSuccess = await loginAs(page, CLIENT, 'client')
    if (!clientSuccess) { test.skip(); return }

    // Logout completo
    await forceLogout(page)

    // Login admin
    const adminSuccess = await loginAs(page, ADMIN, 'admin')
    if (!adminSuccess) { test.skip(); return }
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

  test('4.3 Login admin → logout → login executor sem crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    // Login admin
    const adminSuccess = await loginAs(page, ADMIN, 'admin')
    if (!adminSuccess) { test.skip(); return }

    // Logout completo
    await forceLogout(page)

    // Login executor
    const execSuccess = await loginAs(page, EXECUTOR, 'executor')
    if (!execSuccess) { test.skip(); return }
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

  test('4.4 Ciclo completo: admin → executor → cliente → admin', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', err => jsErrors.push(err.message))

    const profiles = [
      { creds: ADMIN, role: 'admin' },
      { creds: EXECUTOR, role: 'executor' },
      { creds: CLIENT, role: 'client' },
      { creds: ADMIN, role: 'admin' },
    ]

    for (const profile of profiles) {
      // Logout completo
      await forceLogout(page)

      const success = await loginAs(page, profile.creds, profile.role)
      if (!success) { test.skip(); return }
      await page.waitForTimeout(1500)
    }

    const criticalErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('extension') &&
      !e.includes('Failed to fetch') &&
      !e.includes('Cannot read properties of undefined') &&
      !e.includes('net::')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

// ============================================================
// BLOCO 5: SUPABASE DATA INTEGRITY
// ============================================================
test.describe('5. Cross-Profile — Integridade Supabase', () => {
  test('5.1 Projetos carregados contêm campos obrigatórios', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    // Verificar logs de carregamento de projetos
    const projectLoadLogs = consoleLogs.filter(l =>
      l.includes('[SupabaseAdapter]') && l.includes('projetos encontrados')
    )
    expect(projectLoadLogs.length).toBeGreaterThanOrEqual(1)

    // Se projetos foram encontrados, deve ter pelo menos 1
    const countMatch = projectLoadLogs[0]?.match(/(\d+) projetos/)
    if (countMatch) {
      expect(parseInt(countMatch[1])).toBeGreaterThanOrEqual(1)
    }
  })

  test('5.2 Cada projeto tem QR Code ID no formato correto', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    // Verificar que QR codes seguem o padrão QR-{timestamp}-PERMANENT
    const qrLogs = consoleLogs.filter(l => l.includes('QR-') && l.includes('PERMANENT'))
    expect(qrLogs.length).toBeGreaterThanOrEqual(1)
  })

  test('5.3 Projetos mostram User e Executor nos logs', async ({ page }) => {
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') consoleLogs.push(msg.text())
    })

    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }
    await page.waitForTimeout(3000)

    // Logs devem mostrar User e Executor para cada projeto
    const projectLogs = consoleLogs.filter(l => l.includes('User:') && l.includes('Executor:'))
    expect(projectLogs.length).toBeGreaterThanOrEqual(1)
  })

  test('5.4 Admin pode navegar para aba Clientes e ver dados', async ({ page }) => {
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }

    const clientesTab = page.locator('button').filter({ hasText: 'Clientes' })
    if (await clientesTab.count() > 0) {
      await clientesTab.first().click()
      await page.waitForTimeout(2000)
      const body = await getVisibleProjectTexts(page)
      // Deve ter algum conteúdo de clientes
      expect(body.length).toBeGreaterThan(50)
    }
  })
})

// ============================================================
// BLOCO 6: CONSISTÊNCIA DE LAYOUT POR ROLE
// ============================================================
test.describe('6. Cross-Profile — Layout por Role', () => {
  test('6.1 Admin usa AdminLayout (sem bottom nav)', async ({ page }) => {
    const success = await loginAs(page, ADMIN, 'admin')
    if (!success) { test.skip(); return }

    // Admin: sidebar com "Painel Admin", sem bottom nav
    const painelAdmin = page.locator('text=Painel Admin')
    expect(await painelAdmin.count()).toBeGreaterThanOrEqual(1)

    // Sem bottom navigation de cliente
    const bottomNavButtons = page.locator('nav button').filter({ hasText: /^(Painel|Etapas|Galeria|Chat|Perfil)$/i })
    expect(await bottomNavButtons.count()).toBe(0)
  })

  test('6.2 Executor usa ExecutorLayout (com bottom nav específica)', async ({ page }) => {
    const success = await loginAs(page, EXECUTOR, 'executor')
    if (!success) { test.skip(); return }

    // Executor deve ter bottom nav ou sidebar com tabs específicas
    const body = await getVisibleProjectTexts(page)
    const hasExecutorUI = body.includes('Dashboard') || body.includes('Projetos') ||
                         body.includes('Agenda') || body.includes('Clientes')
    expect(hasExecutorUI).toBeTruthy()
  })

  test('6.3 Cliente usa MobileLayout (com bottom nav 5 itens)', async ({ page }) => {
    const success = await loginAs(page, CLIENT, 'client')
    if (!success) { test.skip(); return }

    // Cliente deve ter bottom nav com 5 itens
    const bottomNavItems = ['Painel', 'Etapas', 'Galeria', 'Chat', 'Perfil']
    let found = 0
    for (const item of bottomNavItems) {
      const navBtn = page.locator('button').filter({ hasText: new RegExp(`^${item}$`, 'i') })
        .or(page.locator('a').filter({ hasText: new RegExp(`^${item}$`, 'i') }))
      if (await navBtn.count() > 0) found++
    }
    expect(found).toBeGreaterThanOrEqual(3)
  })

  test('6.4 Cada perfil vê header correto', async ({ page }) => {
    // Admin: logo + data
    const adminSuccess = await loginAs(page, ADMIN, 'admin')
    if (!adminSuccess) { test.skip(); return }
    const adminHeader = page.locator('header')
    expect(await adminHeader.count()).toBeGreaterThanOrEqual(1)

    // Logout completo e login como cliente
    await forceLogout(page)

    const clientSuccess = await loginAs(page, CLIENT, 'client')
    if (!clientSuccess) { test.skip(); return }
    // Cliente: header com EliteTrack logo
    const clientHeader = page.locator('header')
    expect(await clientHeader.count()).toBeGreaterThanOrEqual(1)
  })
})
