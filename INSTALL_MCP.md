# 🚀 Instalando e Configurando MCP do Supabase

## 🔍 Diagnóstico

O MCP (Model Context Protocol) do Supabase não estava disponível no ambiente. Testei várias abordagens e descobri:

### ✅ MCP Server Encontrado
- **Pacote**: `@supabase/mcp-server-supabase` (versão 0.6.1)
- **Status**: ✅ Instalado globalmente
- **Problema**: Não está configurado no WindSurf

---

## 📋 Passos para Instalar e Configurar

### 1. Instalar MCP Server (Já feito ✅)
```bash
npm install -g @supabase/mcp-server-supabase
```

### 2. Configurar no WindSurf

#### Método A: Via Interface do WindSurf
1. Abra o WindSurf
2. Vá para **Settings** (ícone de engrenagem)
3. Clique em **MCP Servers**
4. Clique em **Add Server**
5. Configure:
   - **Name**: `supabase`
   - **Command**: `npx @supabase/mcp-server-supabase`
   - **Environment Variables**:
     ```
     SUPABASE_URL=https://rlaxbloitiknjikrpbim.supabase.co
     SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8
     ```

#### Método B: Via Arquivo de Configuração
1. Crie o arquivo: `~/.windsurf/mcp_servers.json`
2. Adicione:
```json
{
  "supabase": {
    "command": "npx",
    "args": ["@supabase/mcp-server-supabase"],
    "env": {
      "SUPABASE_URL": "https://rlaxbloitiknjikrpbim.supabase.co",
      "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhibG9pdGlrbmppa3JwYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MzQwNzcsImV4cCI6MjA4MjQxMDA3N30.pq550K7XirbU8QnKSNOaIvs9WD-wi6cLQbS0GlH_9o8"
    }
  }
}
```

### 3. Reiniciar o WindSurf
Após configurar, reinicie o WindSurf para carregar o MCP server.

---

## 🔧 Supabase CLI (Alternativa)

O Supabase CLI não pode ser instalado globalmente via npm. Use:

### Windows (via Scoop)
```bash
scoop install supabase
```

### Windows (via Chocolatey)
```bash
choco install supabase
```

### Manual
1. Baixe de: https://github.com/supabase/cli/releases
2. Adicione ao PATH do sistema

---

## 📊 Funcionalidades do MCP

Com o MCP configurado, você poderá:

- ✅ Listar tabelas do banco
- ✅ Executar consultas SQL
- ✅ Criar/modificar tabelas
- ✅ Gerenciar policies RLS
- ✅ Visualizar estrutura do banco

---

## 🎯 Verificação

Após configurar, teste com:

```bash
# No WindSurf, use o MCP para listar tabelas
@supabase list_tables

# Ou execute SQL
@supabase execute_sql "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
```

---

## 📝 Notas Importantes

1. **Segurança**: Nunca exponha a `SUPABASE_ANON_KEY` em repositórios públicos
2. **Permissões**: O MCP respeitará as permissões do usuário no Supabase
3. **Conexão**: O MCP usa a ANON_KEY, então operações administrativas podem requerer SERVICE_ROLE_KEY

---

## 🚀 Alternativa se MCP não funcionar

Se o MCP não funcionar, continue usando:

1. **SQL Editor Manual**: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql
2. **Supabase CLI**: `supabase db push`
3. **API REST**: Para operações CRUD básicas

---

## ✅ Status Atual

- ✅ MCP Server instalado
- ⏳ Aguardando configuração no WindSurf
- ✅ Tabelas já criadas manualmente
- ✅ Aplicação funcional
