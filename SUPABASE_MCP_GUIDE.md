# 🚀 Guia Completo - Supabase MCP + CLI

## 📋 O Que Foi Configurado

### ✅ 1. MCP Global do Supabase

Configuração criada em: `C:\Users\admin\.windsurf\mcp_settings.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://rlaxbloitiknjikrpbim.supabase.co",
        "SUPABASE_ANON_KEY": "...",
        "SUPABASE_ACCESS_TOKEN": "sbp_..."
      }
    }
  }
}
```

### ✅ 2. Script Helper Local

Arquivo: `supabase_mcp_helper.mjs`

Permite executar operações comuns do Supabase via linha de comando.

---

## 🎯 Como Usar o MCP do Supabase

### No Chat do Windsurf

Basta mencionar o MCP nas suas solicitações:

```text
"Use o MCP do Supabase para listar todas as tabelas"
"Com o MCP do Supabase, consulte 10 projetos"
"MCP do Supabase: insira um novo registro em users"
```

### Via Script Helper

```bash
# Listar tabelas
node supabase_mcp_helper.mjs list-tables

# Consultar dados
node supabase_mcp_helper.mjs query projects 10

# Inserir dados
node supabase_mcp_helper.mjs insert users '{"name":"João","email":"joao@example.com"}'

# Atualizar dados
node supabase_mcp_helper.mjs update users abc-123 '{"name":"Maria"}'

# Deletar dados
node supabase_mcp_helper.mjs delete users abc-123

# Executar SQL
node supabase_mcp_helper.mjs exec-sql migration.sql

# Ajuda
node supabase_mcp_helper.mjs help
```

---

## 🔧 Setup em Novos Projetos

### Opção 1: Copiar Arquivo de Configuração

```bash
# Copie o windsurf_mcp_config.json para o novo projeto
cp windsurf_mcp_config.json /caminho/novo-projeto/
```

### Opção 2: Usar Configuração Global

A configuração em `C:\Users\admin\.windsurf\mcp_settings.json` já está ativa globalmente.

Você só precisa garantir que o `.env` do novo projeto tenha:
```env
VITE_SUPABASE_URL=https://rlaxbloitiknjikrpbim.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_TOKEN=sbp_...
```

### Opção 3: Criar via Script

```bash
node supabase_mcp_helper.mjs setup
```

---

## 📦 Estrutura Recomendada de Projetos

```text
meu-projeto/
├── .env                          # Credenciais do Supabase
├── .supabase/                    # Configuração local
│   └── config.toml
├── supabase/
│   ├── migrations/               # Migrações SQL
│   │   ├── 001_initial.sql
│   │   └── 002_add_tables.sql
│   ├── functions/                # Edge Functions
│   └── seed.sql                  # Dados iniciais
├── windsurf_mcp_config.json      # Config MCP (opcional)
└── supabase_mcp_helper.mjs       # Helper (copiar deste projeto)
```

---

## 🚀 Comandos Úteis para Velocidade

### Criar Nova Migração

```bash
# Via script helper
node supabase_mcp_helper.mjs exec-sql supabase/migrations/003_new_feature.sql
```

### Verificar Tabelas

```bash
node supabase_mcp_helper.mjs list-tables
```

### Consulta Rápida

```bash
node supabase_mcp_helper.mjs query projects 5
```

### Setup Completo de Novo Projeto

```bash
# 1. Criar .env com credenciais
echo "VITE_SUPABASE_URL=https://..." > .env
echo "VITE_SUPABASE_ANON_KEY=..." >> .env
echo "SUPABASE_TOKEN=..." >> .env

# 2. Copiar helper
cp ../Elite_track/supabase_mcp_helper.mjs .

# 3. Configurar projeto
node supabase_mcp_helper.mjs setup

# 4. Pronto! Usar no Windsurf
```

---

## 💡 Dicas de Produtividade

### 1. Template de Projeto

Crie um template com:
- `.env.example` com variáveis necessárias
- `supabase_mcp_helper.mjs` pré-configurado
- `windsurf_mcp_config.json` atualizado
- Estrutura de pastas `supabase/migrations/`

### 2. Aliases no Terminal

Adicione ao seu `.bashrc` ou `.zshrc`:
```bash
alias supa="node supabase_mcp_helper.mjs"
alias supa-tables="node supabase_mcp_helper.mjs list-tables"
alias supa-query="node supabase_mcp_helper.mjs query"
```

Uso:
```bash
supa-tables
supa-query projects 10
supa help
```

### 3. Scripts NPM

No `package.json`:
```json
{
  "scripts": {
    "db:tables": "node supabase_mcp_helper.mjs list-tables",
    "db:setup": "node supabase_mcp_helper.mjs setup",
    "db:migrate": "node supabase_mcp_helper.mjs exec-sql"
  }
}
```

Uso:
```bash
npm run db:tables
npm run db:setup
```

---

## 🔐 Segurança

### Nunca Commite Credenciais

Adicione ao `.gitignore`:
```
.env
.env.local
.supabase/
*.key
supabase_token.txt
```

### Use Variáveis de Ambiente

Em produção, configure:
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # Apenas backend
```

---

## 📚 Recursos

- **Supabase MCP**: https://github.com/supabase/mcp-server-supabase
- **Supabase Docs**: https://supabase.com/docs
- **Windsurf MCP**: Documentação interna

---

## ✅ Status Atual do Projeto Elite Track

### Tabelas Criadas

- ✅ `project_photos` - Fotos dos projetos
- ✅ `chat_conversations` - Conversas do chat
- ✅ `chat_messages` - Mensagens do chat
- ✅ `step_photos` - Fotos das etapas

### Funcionalidades Ativas

- ✅ Sincronização de fotos em real-time
- ✅ Chat sincronizado entre perfis
- ✅ Cartão Elite padronizado com logo
- ✅ MCP do Supabase configurado globalmente

### Próximos Passos

1. Testar upload de fotos no dashboard
2. Testar chat entre perfis
3. Implementar conteúdo do EliteShield
4. Criar novas migrações usando o MCP

---

## 🆘 Troubleshooting

### MCP não encontrado

```bash
# Reinstalar globalmente
npm install -g @supabase/mcp-server-supabase
```

### Erro de permissão no SQL

- Execute o SQL manualmente no Dashboard
- URL: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql

### Tabelas não aparecem

```bash
# Verificar status
node setup_tables.mjs
```

---

**🎉 Configuração concluída! Agora você pode usar o MCP do Supabase em qualquer projeto Windsurf.**
