# EliteTrack™ - Aplicativo de Acompanhamento de Blindagem

![EliteTrack](https://img.shields.io/badge/EliteTrack-Premium-gold)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)

Aplicativo mobile premium para acompanhamento em tempo real do processo de blindagem automotiva da Elite Blindagens.

## Deploy Automático

Deploy automático configurado com Vercel + GitHub

## Design System

### Paleta de Cores Luxury-Gold

| Cor | Hex | Uso |
|-----|-----|-----|
| Gold Metálico | `#D4AF37` | Elementos premium, destaques |
| Gold Escuro | `#B8860B` | Hover/pressed states |
| Gold Brilhante | `#FFD700` | Elementos ativos |
| Preto Profundo | `#0A0A0A` | Background dark mode |
| Preto Carbon | `#1A1A1A` | Cards secundários |
| Cinza Grafite | `#2D2D2D` | Bordas e divisores |

### Tipografia

- **Principal:** Inter (400, 500, 600, 700)
- **Display:** Playfair Display (elementos premium)

## 🚀 Funcionalidades

### Dashboard Principal

- ✅ Hero section com carrossel de fotos do veículo
- ✅ Progress Ring animado com porcentagem
- ✅ Card de status com etapa atual
- ✅ Grid de atalhos rápidos (6 opções)
- ✅ Notificações recentes

### Timeline Detalhada

- ✅ Layout vertical com linha central gold
- ✅ Cards expansíveis por etapa
- ✅ Badges de status coloridos
- ✅ Galeria de fotos por etapa
- ✅ Informações do técnico responsável

### Galeria de Mídia

- ✅ Layout masonry responsivo
- ✅ Filtros por etapa
- ✅ Busca por texto
- ✅ Modal fullscreen com navegação
- ✅ Opções de download e compartilhamento

### Chat/Suporte

- ✅ Interface de chat em tempo real
- ✅ Quick replies pré-definidas
- ✅ Indicador de digitação
- ✅ Histórico de mensagens

### Perfil do Usuário

- ✅ Informações pessoais
- ✅ Dados do veículo
- ✅ Toggle Dark/Light mode
- ✅ Menu de configurações

### QR Code EliteTrace™

- ✅ QR Code personalizado com tema gold
- ✅ Opções de compartilhar/baixar/copiar
- ✅ Instruções de uso

## 🛠️ Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Framer Motion** - Animações
- **React Router** - Navegação
- **Lucide React** - Ícones

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/elite-blindagens/elite-track.git

# Entre no diretório
cd elite-track

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```text
src/
├── components/
│   ├── dashboard/       # Componentes do dashboard
│   ├── layout/          # Header, BottomNav, Layout
│   ├── timeline/        # Componentes da timeline
│   └── ui/              # Componentes base (Button, Card, Input, etc.)
├── contexts/
│   ├── AuthContext.tsx  # Autenticação
│   └── ThemeContext.tsx # Tema dark/light
├── data/
│   └── mockData.ts      # Dados de exemplo
├── lib/
│   └── utils.ts         # Utilitários
├── pages/
│   ├── Dashboard.tsx
│   ├── Timeline.tsx
│   ├── Gallery.tsx
│   ├── Chat.tsx
│   ├── Profile.tsx
│   ├── Login.tsx
│   └── QRCode.tsx
├── types/
│   └── index.ts         # Tipos TypeScript
├── App.tsx
├── main.tsx
└── index.css
```

## 🎯 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Linting
```

## 🔐 Autenticação

Para testar o aplicativo, use qualquer email e senha na tela de login. O sistema usa dados mockados para demonstração.

## 🌙 Temas

O aplicativo suporta Dark Mode (padrão) e Light Mode. O toggle está disponível no header e na página de perfil.

## 📱 Responsividade

O design é mobile-first, otimizado para dispositivos móveis com suporte a tablets e desktops.

## 🎨 Componentes UI

| Componente | Descrição |
|------------|-----------|
| `Button` | Botões com variantes gold, outline, ghost, danger |
| `Card` | Cards com variantes default, elevated, bordered |
| `Input` | Inputs com label flutuante e validação |
| `Badge` | Badges de status coloridos |
| `ProgressRing` | Círculo de progresso animado |
| `Avatar` | Avatar com fallback e borda gold |
| `Modal` | Modal com animação slide-up |
| `Skeleton` | Loading states animados |

## 📄 Licença

© 2024 Elite Blindagens. Todos os direitos reservados.

---

**EliteTrack™** - Proteção Premium para seu Patrimônio
