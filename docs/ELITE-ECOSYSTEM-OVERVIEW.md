# Elite Blindagens - Ecossistema de Aplicações

**Versão:** 1.0 | **Data:** Janeiro 2026

---

## Visão Geral

O ecossistema Elite Blindagens é composto por três aplicações web que operam de forma integrada através de um banco de dados centralizado (Supabase). Cada aplicação atende um público específico, mas compartilha a mesma fonte de dados, garantindo consistência e sincronização em tempo real.

---

## 1. Elite Track

**Propósito:** Aplicação mobile-first para clientes e executores acompanharem projetos de blindagem veicular.

### Público-alvo

- **Clientes:** Proprietários de veículos em processo de blindagem
- **Executores:** Técnicos responsáveis pela execução do serviço

### Funcionalidades Principais

| Módulo | Cliente | Executor |
| ------ | ------- | -------- |
| Dashboard | Visualiza status do veículo | Gerencia múltiplos projetos |
| Timeline | Acompanha etapas em tempo real | Atualiza progresso e adiciona fotos |
| Chat | Envia mensagens para equipe | Responde clientes |
| Laudo EliteShield | Visualiza e baixa PDF | Edita dados técnicos |
| QR Code | Acessa projeto via scan | Cadastra novos veículos |
| Notificações | Recebe alertas de progresso | Recebe novos projetos |

### Diferenciais Técnicos do Elite Track

- **Realtime:** Atualizações instantâneas via Supabase Realtime
- **Compressão de imagens:** Redução de ~90% no tamanho de fotos
- **PWA:** Instalável como app nativo
- **Laudo PDF:** Geração client-side com QR Code permanente

### Stack Tecnológico Elite Track

- React 18 + TypeScript
- Vite
- TailwindCSS
- Supabase (Auth, Database, Storage, Realtime)
- jsPDF para geração de laudos

---

## 2. Elite Gestão

**Propósito:** Painel administrativo para gestão comercial e operacional da blindadora.

### Público-alvo da Elite Gestão

- Administradores
- Equipe comercial
- Gestores de operações

### Funcionalidades da Elite Gestão

| Módulo | Descrição |
| ------ | --------- |
| Comercial | Gestão de leads, propostas e conversões |
| Contratos | Geração e acompanhamento de contratos |
| Financeiro | Controle de recebíveis e faturamento |
| Seminovos | Gestão de veículos blindados usados |
| Relatórios | Dashboards com métricas de negócio |
| Usuários | Gestão de acessos e permissões |

### Integração do Elite Gestão com Elite Track

- Lê projetos cadastrados pelos executores
- Visualiza timeline e fotos de cada projeto
- Acessa dados de clientes e veículos
- Gera relatórios consolidados

### Stack Tecnológico do Elite Gestão

- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- Supabase (mesmo banco do Elite Track)
- Recharts para gráficos

---

## 3. Elite Site

**Propósito:** Landing page institucional e portal de consulta pública.

### Público-alvo do Elite Site

- Visitantes interessados em blindagem
- Clientes consultando autenticidade de laudos

### Funcionalidades do Elite Site

| Módulo | Descrição |
| ------ | --------- |
| Landing Page | Apresentação da empresa e serviços |
| Consulta Pública | Verificação de laudos via QR Code ou placa |
| Orçamento | Formulário de solicitação de orçamento |
| Contato | Integração com WhatsApp e formulário |

### Verificação de Autenticidade

Qualquer pessoa pode verificar se um veículo possui blindagem Elite através de:

1. Escaneamento do QR Code no laudo
2. Busca por placa do veículo
3. Busca por ID do projeto

A consulta exibe o laudo completo sem dados sensíveis do proprietário.

---

## Infraestrutura: Supabase

### Por que Supabase?

- **BaaS completo:** Auth, Database, Storage e Realtime em uma plataforma
- **PostgreSQL:** Banco relacional robusto com suporte a JSON
- **Realtime:** WebSockets nativos para sincronização instantânea
- **Row Level Security:** Controle granular de acesso por usuário
- **Storage:** Armazenamento de arquivos com CDN global

### Arquitetura de Dados

```text
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Auth   │  │Database │  │ Storage │  │Realtime │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌───────────┐     ┌───────────┐     ┌───────────┐
  │Elite Track│     │Elite Gestão│    │Elite Site │
  │ (Clientes │     │  (Admin)   │    │ (Público) │
  │ Executores)│    │            │    │           │
  └───────────┘     └───────────┘     └───────────┘
```

### Principais Tabelas

| Tabela | Descrição |
| ------ | --------- |
| `users` | Clientes, executores e admins |
| `projects` | Projetos de blindagem |
| `vehicles` | Veículos cadastrados |
| `timeline_steps` | Etapas do processo |
| `step_photos` | Fotos de cada etapa |
| `notifications` | Alertas do sistema |
| `chat_messages` | Mensagens do chat |

### Sincronização em Tempo Real

Quando um executor atualiza uma etapa:

1. Dado é gravado no PostgreSQL
2. Supabase Realtime detecta a mudança
3. Broadcast via WebSocket para todos os clientes conectados
4. UI atualiza automaticamente (sem refresh)

Latência típica: < 100ms

---

## Resumo de Integração

| Aplicação | Leitura | Escrita | Realtime |
| --------- | ------- | ------- | -------- |
| Elite Track | ✓ | ✓ | ✓ |
| Elite Gestão | ✓ | ✓ | Opcional |
| Elite Site | ✓ | - | - |

### Fluxo de Dados Típico

1. **Cadastro:** Executor cria projeto no Elite Track
2. **Execução:** Executor atualiza timeline e fotos
3. **Acompanhamento:** Cliente vê progresso em tempo real
4. **Gestão:** Admin monitora via Elite Gestão
5. **Entrega:** Laudo gerado com QR Code permanente
6. **Verificação:** Qualquer pessoa pode consultar via Elite Site

---

## Contato Técnico

Para integrações ou dúvidas técnicas:

- **Supabase Project ID:** `rlaxbloitiknjikrpbim`
- **Região:** South America (São Paulo)

---

## Documento Gerado

Gerado em Janeiro/2026
