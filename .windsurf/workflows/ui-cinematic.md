# /ui-cinematic

## Description
Cria componentes ou páginas com UI cinemática dark mode, usando shadcn/ui, Tailwind CSS, animações suaves e acessibilidade básica. Ideal para landing pages, dashboards modernos ou seções hero impactantes.

## Steps

1. **Definição de Requisitos UI**
   - Pergunte ao usuário: tipo de componente/página (hero, card, modal, dashboard section)
   - Identifique conteúdo necessário (texto, imagens, CTAs, dados dinâmicos)
   - Determine paleta de cores (usar design tokens do projeto ou criar novos)
   - Defina estilo: minimal, modern, playful, glassmorphism, etc.

2. **Pesquisa de Referências (Opcional)**
   - Consulte MCPs disponíveis: @21st-dev/magic, @magicuidesign, aceternity, fancycomponents
   - Busque padrões em reactbits.dev, Tailwind UI, Flowbite cards
   - Identifique animações inspiradoras (scroll-triggered, hover effects, transitions)
   - Liste componentes shadcn/ui relevantes a reutilizar

3. **Definição de Design Tokens**
   - Configure tokens em `tailwind.config.ts` se necessário:
     - Cores: background, foreground, accent, muted
     - Espaçamento: padding, margin, gaps
     - Tipografia: font-family, sizes, weights, line-heights
     - Border radius, shadows, animações (durations, easings)
   - Use variáveis CSS customizadas quando apropriado

4. **Estrutura e Markup Semântico**
   - Crie estrutura HTML semântica (`<section>`, `<article>`, `<header>`, `<nav>`)
   - Use componentes shadcn/ui como base (Button, Card, Badge, etc.)
   - Organize em camadas: background → content → overlays
   - Implemente grid/flexbox responsivo com Tailwind

5. **Implementação Visual Cinemática**
   - **Background**: gradientes, mesh gradients, ou background boxes (aceternity style)
   - **Tipografia**: hierarquia clara, text-balance, contrast adequado
   - **Animações**:
     - Entrada: fade-in, slide-in, scale-in com Tailwind animate
     - Hover: transformações suaves, glow effects, scale
     - Scroll: parallax ou scroll-triggered animations (Framer Motion ou CSS)
   - **Glassmorphism** (opcional): backdrop-blur, borders sutis, transparências

6. **Acessibilidade e UX**
   - Adicione ARIA labels em elementos interativos
   - Garanta contraste de cores WCAG 2.2 AA (mínimo 4.5:1 para texto)
   - Implemente keyboard navigation (focus states visíveis)
   - Use `prefers-reduced-motion` para respeitar preferências do usuário
   - Adicione loading skeletons ou estados de carregamento

7. **Responsividade**
   - Teste breakpoints Tailwind: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
   - Ajuste padding, font-sizes, grid columns por viewport
   - Verifique que imagens e vídeos sejam responsivos
   - Teste no mobile-first approach

8. **Otimização de Performance**
   - Use `next/image` para imagens otimizadas (se aplicável)
   - Lazy load imagens e componentes pesados
   - Minimize animações complexas em mobile
   - Verifique que animações usem transform/opacity (GPU-accelerated)

9. **Integração e Verificação**
   - Integre o componente na página/rota apropriada
   - Execute `npm run dev` e visualize no navegador
   - Teste em dark mode (se projeto suporta theme toggle)
   - Valide que não há erros de hidratação (Next.js)

10. **Documentação de Componente**
    - Adicione comentário JSDoc no topo do componente
    - Liste props aceitas e tipos TypeScript
    - Forneça exemplo de uso
    - Documente animações e personalizações possíveis

## Acceptance Criteria

- [ ] Componente/página visualmente impactante com tema dark
- [ ] Animações suaves e performáticas (60fps)
- [ ] Acessibilidade básica: ARIA, keyboard nav, contraste
- [ ] Responsivo em mobile, tablet e desktop
- [ ] Usa componentes shadcn/ui existentes quando possível
- [ ] Código TypeScript sem erros
- [ ] Sem erros de hidratação (Next.js)
- [ ] `prefers-reduced-motion` implementado
- [ ] Core Web Vitals respeitados (LCP < 2.5s, CLS < 0.1)

## How to Use

Invoque este workflow no Cascade digitando:

/ui-cinematic

Exemplo de uso:
- "/ui-cinematic: criar hero section para landing page SaaS"
- "Preciso de um dashboard moderno dark, use /ui-cinematic"
- "/ui-cinematic: card de pricing com glassmorphism e hover effects"
