# PRD - Elite Track Application

## Product Requirements Document para Testes de Segurança

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Nome do Produto

**Elite Track** - Sistema de Rastreamento e Acompanhamento de Blindagem Veicular

### 1.2 Descrição

Plataforma web/mobile para acompanhamento em tempo real do processo de blindagem de veículos. Permite que clientes, executores (funcionários) e administradores acompanhem cada etapa do processo, desde o recebimento do veículo até a entrega final.

### 1.3 Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** TailwindCSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Autenticação:** Custom Auth com Supabase
- **Storage:** Supabase Storage (fotos, documentos)
- **Deploy:** Vercel

---

## 2. ARQUITETURA DO SISTEMA

### 2.1 Estrutura de Arquivos

```text
src/
├── components/         # Componentes reutilizáveis
│   ├── executor/       # Componentes do painel executor
│   ├── laudo/          # Componentes do laudo EliteShield
│   ├── layout/         # Layouts (Header, Sidebar, etc)
│   └── ui/             # Componentes UI genéricos
├── contexts/           # Contextos React (Auth, Projects, etc)
├── pages/              # Páginas da aplicação
├── services/           # Serviços e APIs
├── lib/                # Configurações (Supabase, utils)
├── types/              # Tipos TypeScript
└── constants/          # Constantes da aplicação
```

### 2.2 Banco de Dados (Supabase)

```sql
-- Tabelas principais:
-- users_elitetrack      # Usuários do sistema
-- projects              # Projetos de blindagem
-- timeline_steps        # Etapas da timeline
-- step_photos           # Fotos das etapas
-- temp_passwords        # Senhas temporárias
-- notifications         # Notificações
-- support_tickets       # Tickets de suporte
-- quotes                # Orçamentos
```

---

## 3. PERFIS DE USUÁRIO

### 3.1 Cliente (role: 'client')

**Permissões:**

- Visualizar seu projeto e timeline
- Ver fotos do processo
- Acessar laudo EliteShield
- Baixar Elite Card (PDF)
- Chat com executor
- Criar tickets de suporte

**Rotas acessíveis:**

- `/dashboard` - Painel principal
- `/timeline` - Timeline do projeto
- `/gallery` - Galeria de fotos
- `/laudo` - Laudo EliteShield
- `/elite-card` - Cartão Elite
- `/chat` - Chat com suporte
- `/profile` - Perfil

### 3.2 Executor (role: 'executor')

**Permissões:**

- Todas as permissões do cliente
- Criar novos projetos
- Atualizar status das etapas
- Adicionar fotos às etapas
- Gerar QR Codes
- Gerenciar múltiplos clientes
- Responder tickets

**Rotas acessíveis:**

- `/dashboard` - Painel do Executor
- `/timeline` - Gerenciar timelines
- `/photos` - Gerenciar fotos
- `/clients` - Lista de clientes
- `/quotes` - Orçamentos
- `/tickets` - Tickets de suporte
- `/schedule` - Agenda

### 3.3 Administrador (role: 'admin')

**Permissões:**

- Todas as permissões do executor
- Gerenciar usuários
- Configurações do sistema
- Relatórios e métricas
- Backup e restauração

**Rotas acessíveis:**

- Todas as rotas do executor
- `/admin` - Painel administrativo

---

## 4. FLUXOS PRINCIPAIS

### 4.1 Fluxo de Login

```text
1. Usuário acessa /login
2. Insere email e senha
3. Sistema valida:
   a. Primeiro: Supabase (users_elitetrack)
   b. Segundo: Senhas temporárias (temp_passwords)
4. Se válido: cria sessão, redireciona para /dashboard
5. Se inválido: mostra erro
```

### 4.2 Fluxo de Criação de Projeto (Executor)

```text
1. Executor clica em "Novo Projeto"
2. Preenche dados do cliente:
   - Nome, email, telefone
   - CPF/CNPJ, endereço
3. Preenche dados do veículo:
   - Marca, modelo, ano, placa
   - Cor, chassi, km entrada
   - Foto do veículo (obrigatória)
4. Define especificações de blindagem:
   - Nível de proteção
   - Tipo de vidro
   - Responsável técnico
5. Sistema cria:
   - Projeto no Supabase
   - Timeline com 7 etapas padrão
   - QR Code do projeto
   - Senha temporária para cliente
6. Executor compartilha via WhatsApp/Email
```

### 4.3 Fluxo de Atualização de Timeline

```text
1. Executor seleciona projeto
2. Clica em etapa para expandir
3. Pode:
   - Iniciar etapa (pending → in_progress)
   - Adicionar fotos (câmera ou galeria)
   - Adicionar observações
   - Concluir etapa (in_progress → completed)
4. Ao concluir, deve definir data da próxima etapa
5. Sistema atualiza progresso automaticamente
6. Cliente recebe notificação (se configurado)
```

### 4.4 Fluxo de Upload de Fotos

```text
1. Executor clica em "Adicionar Foto"
2. Seleciona tipo: Antes, Durante, Depois, Detalhe, Material
3. Escolhe: Tirar Foto (câmera) ou Galeria
4. Sistema:
   - Valida tipo (imagem) e tamanho (max 10MB)
   - Mostra loading com progresso
   - Upload para Supabase Storage
   - Salva referência em step_photos
   - Atualiza projeto
5. Foto aparece imediatamente na galeria
```

---

## 5. ENDPOINTS E TABELAS

### 5.1 Tabela: users_elitetrack

```sql
CREATE TABLE users_elitetrack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'executor', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Tabela: projects

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  qr_code TEXT UNIQUE,
  executor_id TEXT,
  user_data JSONB,
  vehicle_data JSONB,
  status TEXT,
  progress INTEGER DEFAULT 0,
  timeline JSONB,
  blinding_specs JSONB,
  laudo_data JSONB,
  start_date TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.3 Tabela: step_photos

```sql
CREATE TABLE step_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT,
  stage TEXT,
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Tabela: temp_passwords

```sql
CREATE TABLE temp_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  project_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. AUTENTICAÇÃO E SEGURANÇA

### 6.1 Mecanismos de Autenticação

1. **Login padrão:** Email + senha (hash no banco)
2. **Senha temporária:** 4 dígitos, expira em 7 dias
3. **Sessão:** JWT-like com expiração de 24h
4. **Device ID:** Previne uso em múltiplos dispositivos

### 6.2 Row Level Security (RLS)

```sql
-- Exemplo de policy para projects
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
USING (
  auth.uid()::text = user_data->>'id' OR
  auth.uid()::text = executor_id
);
```

### 6.3 Pontos de Atenção para Testes de Segurança

#### 6.3.1 Autenticação

- [ ] Testar força bruta de login
- [ ] Testar vazamento de informações em erros
- [ ] Testar expiração de sessão
- [ ] Testar manipulação de tokens
- [ ] Testar bypass de senha temporária

#### 6.3.2 Autorização

- [ ] Testar acesso entre perfis (cliente acessando executor)
- [ ] Testar IDOR (acessar projeto de outro cliente)
- [ ] Testar escalação de privilégios
- [ ] Testar manipulação de role no frontend

#### 6.3.3 Input Validation

- [ ] Testar XSS em campos de texto
- [ ] Testar SQL Injection
- [ ] Testar upload de arquivos maliciosos
- [ ] Testar CSRF em formulários

#### 6.3.4 API/Database

- [ ] Testar políticas RLS do Supabase
- [ ] Testar acesso direto às tabelas
- [ ] Testar endpoints não autenticados
- [ ] Testar rate limiting

#### 6.3.5 Storage

- [ ] Testar acesso a fotos de outros projetos
- [ ] Testar upload de tipos não permitidos
- [ ] Testar path traversal em URLs

---

## 7. CASOS DE TESTE FUNCIONAIS

### 7.1 Login e Autenticação

| ID | Caso de Teste | Passos | Resultado Esperado |
|---|---|---|---|
| L01 | Login válido | Acessar /login, inserir credenciais válidas, clicar Entrar | Redireciona para /dashboard |
| L02 | Login inválido | Inserir credenciais inválidas | Mostra erro "Credenciais inválidas" |
| L03 | Lembrar-me | Marcar checkbox, fazer login, fechar e reabrir | Credenciais preenchidas |
| L04 | Esqueci senha | Clicar "Esqueci a senha", inserir email | Modal abre, permite enviar |
| L05 | Solicitar acesso | Clicar "Solicite acesso" | Modal abre com formulário |

### 7.2 Gestão de Projetos (Executor)

| ID | Caso de Teste | Passos | Resultado Esperado |
|---|---|---|---|
| P01 | Criar projeto | Clicar "Novo Projeto", preencher dados, adicionar foto, criar | Projeto criado, QR gerado |
| P02 | Evitar duplicado | Clicar "Criar" múltiplas vezes rapidamente | Apenas 1 projeto criado |
| P03 | Iniciar etapa | Selecionar projeto, clicar "Iniciar Etapa" | Status muda para in_progress |
| P04 | Concluir etapa | Etapa em progresso, clicar "Concluir" | Modal pede data próxima etapa |

### 7.3 Upload de Fotos

| ID | Caso de Teste | Passos | Resultado Esperado |
|---|---|---|---|
| F01 | Upload via galeria | Clicar "Galeria", selecionar imagem | Foto enviada, aparece na galeria |
| F02 | Upload via câmera | Clicar "Tirar Foto", capturar imagem | Câmera abre (mobile), foto enviada |
| F03 | Feedback loading | Durante upload | Modal com "Enviando foto..." visível |
| F04 | Arquivo inválido | Tentar enviar PDF | Erro ou não processa |
| F05 | Arquivo grande | Tentar enviar maior que 10MB | Erro informativo |

### 7.4 Timeline

| ID | Caso de Teste | Passos | Resultado Esperado |
|---|---|---|---|
| T01 | Manter projeto selecionado | Selecionar projeto, iniciar etapa | Mesmo projeto permanece selecionado |
| T02 | Progresso automático | Concluir etapas | Porcentagem atualiza corretamente |
| T03 | Bloqueio sequencial | Tentar iniciar etapa 3 sem concluir 2 | Etapa bloqueada |

---

## 8. CREDENCIAIS DE TESTE

### 8.1 Usuários de Teste (Supabase)

```text
Admin Master:
- Email: juniorrodrigues1011@gmail.com
- Role: admin

Executor Teste:
- Email: Joao@teste.com
- Senha: Teste@2025
- Role: executor

Cliente Teste:
- Email: erick@teste.com
- Senha: Teste@2025
- Role: client
```

### 8.2 URLs de Teste

```text
Produção: https://elite-track.vercel.app
Local: http://localhost:5173

Rotas públicas:
- /login
- /verify/:projectId
- /qr/:code
```

---

## 9. MÉTRICAS DE QUALIDADE

### 9.1 Performance

- **LCP (Largest Contentful Paint):** menor que 2.5s
- **INP (Interaction to Next Paint):** menor que 200ms
- **CLS (Cumulative Layout Shift):** menor que 0.1
- **Upload de foto:** menor que 5s para arquivo de 5MB

### 9.2 Acessibilidade

- **WCAG 2.2 AA:** Todos os botões com aria-label
- **Contraste:** Mínimo 4.5:1 para texto
- **Navegação:** Funciona via teclado

### 9.3 Compatibilidade

- **Browsers:** Chrome, Firefox, Safari, Edge
- **Mobile:** iOS Safari, Android Chrome
- **Responsivo:** 320px a 1920px

---

## 10. RISCOS E MITIGAÇÕES

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Vazamento de dados | Alto | Baixo | RLS, criptografia, audit logs |
| DDoS | Médio | Médio | Rate limiting, CDN |
| Upload malicioso | Alto | Baixo | Validação de tipo, antivírus |
| Sessão hijacking | Alto | Baixo | Device ID, expiração curta |
| IDOR | Alto | Médio | RLS, validação server-side |

---

## 11. CHECKLIST PRÉ-PRODUÇÃO

### 11.1 Segurança

- [ ] RLS ativo em todas as tabelas
- [ ] Senhas com hash (bcrypt)
- [ ] HTTPS obrigatório
- [ ] CORS configurado
- [ ] Rate limiting ativo
- [ ] Logs de auditoria

### 11.2 Performance

- [ ] Imagens otimizadas
- [ ] Code splitting
- [ ] Cache configurado
- [ ] CDN ativo

### 11.3 Monitoramento

- [ ] Error tracking (Sentry)
- [ ] Analytics
- [ ] Uptime monitoring
- [ ] Alertas configurados

---

## 12. CONTATOS

**Desenvolvedor:** Erick

**GitHub:** erickerk/Elite_track

**Vercel:** ericks-projects-a9788af3/elite-track

---

*Documento gerado em 19/01/2026 para testes de segurança com TestSprite*
