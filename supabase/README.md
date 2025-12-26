# 🗄️ Configuração do Supabase - EliteTrack™

## 📋 Visão Geral

Este diretório contém toda a estrutura necessária para integrar o EliteTrack com o Supabase como backend.

## 🚀 Passos para Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em "New Project"
3. Escolha a organização e preencha:
   - **Name:** `elitetrack-prod` (ou nome desejado)
   - **Database Password:** (guarde em local seguro!)
   - **Region:** South America (São Paulo) - `sa-east-1`
4. Aguarde a criação do projeto (1-2 minutos)

### 2. Obter Credenciais

1. Após criar o projeto, vá em **Settings > API**
2. Copie os valores:
   - **Project URL:** `https://xxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Executar Migração

#### Opção A: Via Dashboard Supabase
1. Acesse **SQL Editor** no dashboard do Supabase
2. Copie todo o conteúdo de `migrations/001_initial_schema.sql`
3. Cole no editor e clique em **Run**

#### Opção B: Via CLI Supabase
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref seu-project-ref

# Aplicar migrações
supabase db push
```

### 5. Gerar Tipos TypeScript (Opcional)

Após executar a migração, gere os tipos atualizados:

```bash
npx supabase gen types typescript --project-id seu-project-id > src/lib/supabase/types.ts
```

## 📁 Estrutura de Arquivos

```
supabase/
├── README.md                          # Este arquivo
└── migrations/
    └── 001_initial_schema.sql         # Schema inicial do banco

src/lib/supabase/
├── client.ts                          # Cliente Supabase configurado
├── types.ts                           # Tipos TypeScript do banco
└── index.ts                           # Exports centralizados

src/services/storage/
├── StorageAdapter.ts                  # Interfaces base
├── LocalStorageAdapter.ts             # Implementação localStorage
├── SupabaseAdapter.ts                 # Implementação Supabase
└── index.ts                           # Factory e exports
```

## 🔄 Como Funciona a Migração

A aplicação detecta automaticamente se o Supabase está configurado:

1. **Se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidos:**
   - Usa Supabase como backend
   - Dados persistem no banco PostgreSQL
   - Suporte a RLS (Row Level Security)

2. **Se as variáveis NÃO estão definidas:**
   - Usa localStorage como fallback
   - Aplicação funciona normalmente (modo demo)
   - Dados persistem apenas no navegador

## 🛡️ Segurança (RLS)

O schema inclui políticas de Row Level Security pré-configuradas:

- **Usuários:** Podem ver/editar apenas seu próprio perfil
- **Projetos:** Clientes veem só seus projetos; executores veem todos
- **Notificações:** Usuários veem apenas suas notificações
- **Tickets:** Clientes veem seus tickets; executores veem todos

## 📊 Tabelas Criadas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários (clientes, executores, admins) |
| `vehicles` | Veículos cadastrados |
| `vehicle_images` | Fotos dos veículos |
| `projects` | Projetos de blindagem |
| `timeline_steps` | Etapas da timeline |
| `step_photos` | Fotos das etapas |
| `blinding_specs` | Especificações técnicas |
| `blinding_materials` | Materiais utilizados |
| `delivery_schedules` | Agendamentos de entrega |
| `delivery_checklists` | Checklist de entrega |
| `elite_cards` | Cartões Elite VIP |
| `support_tickets` | Tickets de suporte |
| `ticket_messages` | Mensagens dos tickets |
| `notifications` | Notificações |
| `chat_conversations` | Conversas do chat |
| `chat_messages` | Mensagens do chat |
| `registration_invites` | Convites de cadastro |
| `vehicle_owners` | Histórico de proprietários |
| `maintenance_services` | Serviços de manutenção |
| `revision_history` | Histórico de revisões |
| `temp_passwords` | Senhas temporárias |

## ⚡ Comandos Úteis

```bash
# Verificar conexão
npx supabase db ping

# Resetar banco (CUIDADO: apaga todos os dados!)
npx supabase db reset

# Ver logs
npx supabase logs

# Gerar tipos
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

## 🐛 Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se o `.env` existe e tem as variáveis corretas
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "relation does not exist"
- Execute a migração SQL no Supabase Dashboard
- Verifique se está conectado ao projeto correto

### Erro: "permission denied"
- Verifique as políticas RLS no dashboard
- Confirme que o usuário está autenticado

## 📞 Suporte

Em caso de dúvidas sobre a integração, consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
