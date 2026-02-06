---
description: Corrigir problemas de layout mobile no Elite Track
---

# /fix-mobile-layout

## Antes de qualquer alteração, LEIA estes arquivos:

1. `tailwind.config.js` — Design tokens, cores, tipografia, animações
2. `src/index.css` (676 linhas) — Estilos globais, light/dark mode overrides
3. `.windsurf/ui-spec.md` — Especificação UI/UX do projeto
4. `src/components/layout/Layout.tsx` (25 linhas) — Wrapper principal (usa MobileLayout)
5. `src/components/layout/MobileLayout.tsx` (320 linhas) — Drawer + Bottom Nav
6. `src/components/layout/ExecutorShell.tsx` (391 linhas) — Sidebar executor
7. `src/components/layout/BottomNav.tsx` (48 linhas) — Navegação inferior

## Design Tokens

### Cores
- **Primary**: `gold` (#D4AF37), `gold-dark` (#B8860B), `gold-bright` (#FFD700)
- **Background**: `carbon-900` (#0A0A0A), `carbon-800` (#1A1A1A), `carbon-700` (#2D2D2D)
- **Status**: success (#00C853), warning (#FF6B35), info (#2196F3), error (#F44336)

### Breakpoints Tailwind
- `sm`: 640px | `md`: 768px | `lg`: 1024px | `xl`: 1280px

### Tipografia
- H1: 24px mobile / 32px desktop
- H2: 20px mobile / 24px desktop
- Body: 14px mobile / 16px desktop
- Caption: 12px mobile / 14px desktop

## Padrões obrigatórios para mobile

### Imagens
```
className="w-32 sm:w-48 max-w-full"  // NUNCA usar tamanho fixo sem responsive
```

### Cards
```
className="p-4 sm:p-6"  // Padding menor no mobile
```

### Grids
```
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
```

### Texto responsivo
```
className="text-sm sm:text-base"
className="text-h2 sm:text-h1"
```

### Bottom nav safe area
```
className="pb-20 sm:pb-4"  // Compensar bottom nav de 64px no mobile
```

### Scroll containers
```
className="overflow-x-auto -mx-4 px-4"  // Scroll horizontal com padding
```

## Arquivos que mais afetam mobile (por ordem de impacto)

1. `src/components/layout/MobileLayout.tsx` — Drawer, bottom nav, header
2. `src/components/laudo/EliteShieldLaudo.tsx` — Laudo completo (15 seções)
3. `src/pages/LandingPage.tsx` (853 linhas) — Hero, features, testimonials
4. `src/pages/Dashboard.tsx` (763 linhas) — Cards de projeto
5. `src/pages/Timeline.tsx` (638 linhas) — Etapas visuais com fotos
6. `src/components/executor/ExecutorTimeline.tsx` (1060 linhas) — Timeline do executor

## Problemas conhecidos

- QR Code no laudo: `w-48 h-48` fixo → deveria ser `w-32 sm:w-48`
- `MobileLayout.tsx` e `ExecutorShell.tsx` duplicam lógica de drawer
- Bottom nav height (64px) não é compensada consistentemente
- Algumas modais não respeitam `max-h-screen` no mobile

## Checklist de validação

- [ ] Testar em viewport 375x667 (iPhone SE)
- [ ] Testar em viewport 390x844 (iPhone 14)
- [ ] Testar em viewport 768x1024 (iPad)
- [ ] Bottom nav não sobrepõe conteúdo
- [ ] Drawer abre/fecha sem bugs
- [ ] Imagens não estouram o container
- [ ] Texto não é cortado
- [ ] Touch targets ≥ 44x44px

## Teste Playwright

```bash
# Testar mobile viewport
npx playwright test --project=chromium --headed
```
