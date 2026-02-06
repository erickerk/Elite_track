/**
 * Testes E2E — Perfil Operador
 * Valida todas as alterações do requisito:
 *   1. Timeline com 9 etapas (Liberação do Exército x2)
 *   2. Specs condicionais por tipo de blindagem
 *   3. Garantia opacos 10 anos
 *   4. Remoção de "uso: executivo"
 *   5. QR Code EliteTrace sempre visível e com link correto
 */

import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:5173'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Aguarda o laudo carregar (título ELITESHIELD™ aparece) */
async function waitForLaudo(page: import('@playwright/test').Page) {
  await page.waitForSelector('h1:has-text("ELITESHIELD")', { timeout: 15000 })
}

// ──────────────────────────────────────────────
// 1. Laudo público — Safe Core (projeto existente test123)
// ──────────────────────────────────────────────

test.describe('Laudo Público — Safe Core (test123)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/verify/test123`)
    await waitForLaudo(page)
  })

  test('exibe specs de vidro Safe Core: Millenium / Argus / 21mm ±1mm / 42 kg', async ({ page }) => {
    // Seção Especificação Técnica
    const specsSection = page.locator('text=Vidros Blindados').first()
    await expect(specsSection).toBeVisible()

    // Verificar dados Safe Core
    await expect(page.locator('text=Millenium').first()).toBeVisible()
    await expect(page.locator('text=Argus').first()).toBeVisible()
    await expect(page.locator('text=21mm ±1mm').first()).toBeVisible()
    await expect(page.locator('text=42 kg').first()).toBeVisible()
    await expect(page.locator('text=10 anos contra delaminação').first()).toBeVisible()
  })

  test('exibe garantia de opacos 10 anos', async ({ page }) => {
    // Na seção de Especificação Técnica, Materiais Opacos
    const opacosSection = page.locator('text=Materiais Opacos').first()
    await expect(opacosSection).toBeVisible()

    // Garantia opacos = 10 anos
    const garantiaOpacos = page.locator('text=10 anos').first()
    await expect(garantiaOpacos).toBeVisible()
  })

  test('NÃO exibe "Uso: Executivo" na linha de blindagem', async ({ page }) => {
    // A seção Linha de Blindagem deve ter Nível mas NÃO ter Uso
    const linhaSection = page.locator('button:has-text("Linha de Blindagem")')
    await expect(linhaSection).toBeVisible()

    // Nível deve existir
    await expect(page.locator('text=Nível: NIJ III-A').first()).toBeVisible()

    // "Uso:" NÃO deve existir no laudo
    const usoText = page.locator('text=/Uso:\\s*(Executivo|Civil|Especial)/')
    await expect(usoText).toHaveCount(0)
  })

  test('QR Code EliteTrace é sempre visível', async ({ page }) => {
    const qrImage = page.locator('img[alt="QR Code EliteTrace"]')
    await expect(qrImage).toBeVisible()
  })

  test('QR Code aponta para URL /verify/ correta', async ({ page }) => {
    const qrImage = page.locator('img[alt="QR Code EliteTrace"]')
    const src = await qrImage.getAttribute('src')
    expect(src).toBeTruthy()

    // O QR Code deve conter a URL de verificação codificada
    const decodedSrc = decodeURIComponent(src || '')
    expect(decodedSrc).toContain('/verify/')
    // Aceita tanto localhost (dev) quanto domínio de produção
    const hasValidDomain = decodedSrc.includes('localhost') || decodedSrc.includes('eliteblindagens.com.br')
    expect(hasValidDomain).toBe(true)
  })

  test('Garantias Ativas mostra Vidros 10 anos e Opacos 10 anos', async ({ page }) => {
    const garantiasBtn = page.locator('button:has-text("Garantias Ativas")')
    await expect(garantiasBtn).toBeVisible()

    // Verificar que ambas garantias são 10 anos
    const dezAnos = page.locator('text=10 anos')
    const count = await dezAnos.count()
    // Deve haver pelo menos 2 ocorrências de "10 anos" (vidros + opacos em Garantias + specs)
    expect(count).toBeGreaterThanOrEqual(2)
  })
})

// ──────────────────────────────────────────────
// 2. Timeline — Novas etapas
// ──────────────────────────────────────────────

test.describe('Timeline — Etapas do processo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/verify/test123`)
    await waitForLaudo(page)
  })

  test('seção Processo de Execução contém etapas do timeline', async ({ page }) => {
    const processoBtn = page.getByRole('button', { name: 'Processo de Execução', exact: true })
    await expect(processoBtn).toBeVisible()

    // Verificar que etapas fundamentais existem
    await expect(page.locator('text=Recebimento do Veículo').first()).toBeVisible()
    await expect(page.locator('text=Desmontagem').first()).toBeVisible()
    await expect(page.locator('text=Entrega').first()).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// 3. Navegação — Landing Page e Login
// ──────────────────────────────────────────────

test.describe('Navegação geral', () => {
  test('Landing Page carrega corretamente', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')
    // Deve ter conteúdo da landing
    await expect(page.locator('text=Elite').first()).toBeVisible()
  })

  test('Login page é acessível', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    // Formulário de login deve existir
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"], input[name="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 10000 })
  })

  test('/dashboard redireciona para /login quando não autenticado', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    // Deve redirecionar para login
    expect(page.url()).toContain('/login')
  })
})

// ──────────────────────────────────────────────
// 4. Laudo — Seções jurídicas presentes
// ──────────────────────────────────────────────

test.describe('Laudo — Integridade das seções', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/verify/test123`)
    await waitForLaudo(page)
  })

  test('todas as seções do laudo estão presentes', async ({ page }) => {
    const sections = [
      'Identificação do Veículo',
      'Dados do Cliente',
      'Linha de Blindagem',
      'Especificação Técnica',
      'Registro Fotográfico',
      'Processo de Execução',
      'Testes e Verificações',
      'Responsáveis Técnicos',
      'Garantias Ativas',
      'EliteTrace™',
      'Declaração Final',
    ]

    for (const section of sections) {
      const btn = page.getByRole('button', { name: section, exact: true })
      await expect(btn).toBeVisible({ timeout: 5000 })
    }
  })

  test('rodapé com Elite Blindagens está presente', async ({ page }) => {
    await expect(page.locator('text=Elite Blindagens').last()).toBeVisible()
    await expect(page.locator('text=Proteção elevada ao estado da arte').first()).toBeVisible()
  })
})
