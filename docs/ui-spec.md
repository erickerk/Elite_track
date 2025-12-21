# EliteTrack™ - Especificações de UI/UX

## Design Tokens

### Cores

#### Primárias (Gold)
```css
--gold-primary: #D4AF37;
--gold-dark: #B8860B;
--gold-bright: #FFD700;
```

#### Neutras
```css
--carbon-900: #0A0A0A;  /* Background dark */
--carbon-800: #1A1A1A;  /* Cards dark */
--carbon-700: #2D2D2D;  /* Bordas */
--white: #FFFFFF;
--off-white: #F8F8F8;   /* Background light */
--gray-light: #E5E5E5;
```

#### Status
```css
--success: #00C853;     /* Verde Esmeralda */
--warning: #FF6B35;     /* Laranja Cobre */
--info: #2196F3;        /* Azul Aço */
--error: #F44336;       /* Vermelho Ferrari */
```

### Gradientes
```css
--gradient-gold: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%);
--gradient-carbon: linear-gradient(135deg, #0A0A0A 0%, #2D2D2D 100%);
--gradient-gold-radial: radial-gradient(circle, #FFD700 0%, #D4AF37 50%, #B8860B 100%);
```

### Sombras
```css
--shadow-gold: 0 4px 20px rgba(212, 175, 55, 0.3);
--shadow-gold-lg: 0 8px 40px rgba(212, 175, 55, 0.4);
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.12);
--shadow-card-dark: 0 4px 24px rgba(0, 0, 0, 0.4);
```

---

## Tipografia

### Família de Fontes
- **Principal:** Inter
- **Display:** Playfair Display

### Escala Tipográfica

| Nome | Tamanho | Peso | Line Height | Uso |
|------|---------|------|-------------|-----|
| H1 | 32px | 700 (Bold) | 1.2 | Títulos principais |
| H2 | 24px | 600 (SemiBold) | 1.3 | Seções |
| H3 | 20px | 500 (Medium) | 1.4 | Subtítulos |
| Body Large | 18px | 400 (Regular) | 1.6 | Textos importantes |
| Body | 16px | 400 (Regular) | 1.6 | Conteúdo principal |
| Caption | 14px | 400 (Regular) | 1.5 | Info secundária |
| Micro | 12px | 400 (Regular) | 1.4 | Labels e dados técnicos |

---

## Espaçamento

### Sistema 8pt
Base: 8px

| Token | Valor |
|-------|-------|
| space-1 | 8px |
| space-2 | 16px |
| space-3 | 24px |
| space-4 | 32px |
| space-5 | 40px |
| space-6 | 48px |

### Margens
- **Mobile:** 20px laterais
- **Tablet:** 32px laterais
- **Desktop:** 40px laterais

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| radius-sm | 8px | Badges, chips |
| radius-md | 12px | Inputs, botões pequenos |
| radius-lg | 16px | Cards pequenos |
| radius-xl | 20px | Cards médios |
| radius-2xl | 24px | Cards grandes |
| radius-full | 9999px | Avatares, pills |

---

## Componentes

### Button

#### Variantes
1. **Gold (Primary)**
   - Background: gradient-gold
   - Text: carbon-900
   - Shadow: shadow-gold
   - Hover: shadow-gold-lg

2. **Outline**
   - Border: 2px gold
   - Text: gold
   - Hover: bg gold/10

3. **Ghost**
   - Text: gold
   - Hover: bg gold/10

4. **Danger**
   - Background: error
   - Text: white

#### Tamanhos
- **SM:** px-4 py-2, text-sm
- **MD:** px-6 py-3, text-base
- **LG:** px-8 py-4, text-lg

#### Estados
- Default
- Hover (scale 1.02)
- Active (scale 0.98)
- Disabled (opacity 50%)
- Loading (spinner)

---

### Card

#### Variantes
1. **Default**
   - Dark: bg-carbon-800, border-carbon-700/50
   - Light: bg-white, border-gray-200/50

2. **Elevated**
   - Dark: + shadow-card-dark
   - Light: + shadow-card

3. **Bordered**
   - Border: 2px gold/30

#### Hover Effect
- translateY(-4px)
- scale(1.01)
- border-gold/30

---

### Input

#### Estados
- Default: border-carbon-700
- Focus: border-gold, ring-gold/50
- Error: border-error
- Disabled: opacity 50%

#### Features
- Label flutuante animada
- Ícone à esquerda
- Toggle de senha
- Mensagem de erro animada

---

### Badge

#### Variantes
| Variante | Background | Text | Border |
|----------|------------|------|--------|
| Default | carbon-700 | gray-300 | - |
| Success | success/20 | success | success/30 |
| Warning | warning/20 | warning | warning/30 |
| Error | error/20 | error | error/30 |
| Info | info/20 | info | info/30 |
| Gold | gold/20 | gold | gold/30 |

---

### Progress Ring

#### Especificações
- Tamanho padrão: 120px
- Stroke width: 8px
- Animação: 1.5s ease-out
- Gradiente: goldGradient

---

## Animações

### Durações
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 1000ms;
```

### Easing Curves
```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Animações Principais

1. **Pulse Gold**
   - Opacidade: 1 → 0.7 → 1
   - Duração: 2s
   - Infinite

2. **Shimmer (Skeleton)**
   - Background position: -200% → 200%
   - Duração: 2s
   - Linear, infinite

3. **Float**
   - TranslateY: 0 → -10px → 0
   - Duração: 3s
   - Ease-in-out, infinite

4. **Progress Ring**
   - Stroke-dashoffset animado
   - Duração: 1.5s
   - Ease-out

---

## Micro-interações

### Button Press
- Scale: 0.98
- Duração: 150ms

### Card Hover
- TranslateY: -4px
- Scale: 1.01
- Border: gold/30
- Duração: 200ms

### Timeline Step Hover
- Elevação sutil
- Brilho gold no ícone

### Notification Pulse
- Pulsação no badge de contagem
- Bounce animation

### Photo Loading
- Skeleton com shimmer gold
- Fade in ao carregar

---

## Responsividade

### Breakpoints
```css
--mobile: 0px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1280px;
```

### Grid
- 12 colunas
- Gutter: 24px
- Margens: 20px (mobile)

---

## Acessibilidade

### Contraste
- Mínimo: 4.5:1 para texto
- Gold sobre carbon-900: ✅ 7.2:1
- White sobre carbon-900: ✅ 21:1

### Touch Targets
- Mínimo: 44x44px

### Focus States
- Ring: 2px gold
- Offset: 2px

---

## Dark/Light Mode

### Transição
- Duração: 300ms
- Propriedades: background-color, color, border-color

### Ajustes de Cor
- Gold mantém mesma saturação
- Backgrounds invertidos
- Sombras ajustadas

---

## Ícones

### Biblioteca
Lucide React

### Tamanhos
- SM: 16px
- MD: 20px
- LG: 24px
- XL: 32px

### Cores
- Default: gray-400
- Active: gold
- Status: cores de status correspondentes

---

## Performance

### Lazy Loading
- Imagens da galeria
- Componentes de rotas

### Cache
- Dados frequentes em localStorage
- Imagens em cache do navegador

### Assets
- SVG para ícones
- WebP para fotos (quando possível)
- Compressão de imagens

---

*Documento de especificações UI/UX - EliteTrack™ v1.0*
*Elite Blindagens © 2024*
