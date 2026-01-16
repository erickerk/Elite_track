# 🎨 UI/UX SPECIFICATION - ELITE TRACK MOBILE PREMIUM

**Versão:** 1.0.0
**Foco:** Mobile First & Premium Experience
**Data:** 15/01/2026

---

## 💎 Design Tokens (SaaS Premium)

### Cores

- **Primary (Gold):** `#D4AF37` (Dourado Elite)
- **Secondary (Dark):** `#0A0A0A` (Preto Carbono)
- **Surface:** `#121212` (Cards e superfícies)
- **Text Primary:** `#F8F8F8` (Off-white para contraste)
- **Text Secondary:** `#A1A1AA` (Cinza para subtextos)
- **Success:** `#22C55E` (Verde aprovado)

### Tipografia Mobile

- **Headings:** `Inter` ou `Lexend`, Font-weight 700, Letter-spacing -0.02em
- **Body:** `Inter`, Font-weight 400, Line-height 1.6
- **Scaling:**
  - H1: 24px (Mobile) / 32px (Desktop)
  - H2: 20px (Mobile) / 24px (Desktop)
  - H3: 18px (Mobile) / 20px (Desktop)
  - Base: 14px (Mobile) / 16px (Desktop)

---

## 📱 Component Patterns (Mobile Optimization)

### 1. Cards Responsivos

- **Padding:** 16px (1rem)
- **Radius:** 12px
- **Border:** `1px solid rgba(212, 175, 55, 0.15)`
- **Shadow:** Subtle glow gold `0 4px 20px rgba(0,0,0,0.5)`

### 2. Grid de Fotos (Timeline)

- **Aspect Ratio:** `aspect-square` (1:1) para consistência visual.
- **Mobile Grid:** `grid-cols-2` ou `grid-cols-3` dependendo do tamanho da tela.
- **Interaction:** Clique para abrir Fullscreen Gallery (Pinch-to-zoom).

### 3. Navegação (Bottom Bar)

- **Height:** 64px
- **Blur:** `backdrop-blur-md`
- **Active State:** Gold icon + subtle dot indicator.

---

## 🚀 Benchmark & UX Principles

### Premium Features (Benchmark: Tesla App / Porsche Connect)

- **Visual Hierarchy:** Menos texto, mais ícones e espaços negativos.
- **Micro-interações:** Feedback tátil (se possível via PWA) e transições suaves.
- **Content-first:** O veículo e o status do projeto são os protagonistas.

### UX Mobile Fixes

- [ ] **Ajuste de Tipografia:** Reduzir tamanhos de fonte em telas < 640px.
- [ ] **Toque Amigável:** Botões com área mínima de 44x44px.
- [ ] **Otimização de Fotos:** `object-cover` para evitar distorções.
- [ ] **Horizontal Scroll:** Usar em seções de cards para não alongar demais a página verticalmente.

---

## 🛠 Plano de Implementação UI/UX

1. **Dashboard Cliente:** Refatorar header e grid de status.
2. **Executor Dashboard:** Simplificar abas complexas em menus colapsáveis ou listas verticais limpas.
3. **Timeline:** Transformar em un componente vertical mais "técnico" e limpo.
4. **Galeria:** Implementar viewer mobile nativo.
