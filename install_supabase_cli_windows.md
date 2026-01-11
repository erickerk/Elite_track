# 🚀 Instalando Supabase CLI no Windows

## ❌ Problemas Encontrados

1. **Scoop não está instalado** - `scoop: command not found`
2. **Chocolatey não tem o pacote supabase** - `0 packages found`
3. **npm global não funciona** - `Installing Supabase CLI as a global module is not supported`

## ✅ Soluções

### Opção 1: Instalar Scoop (Recomendado)

```powershell
# 1. Abrir PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. Instalar Scoop
irm get.scoop.sh | iex

# 3. Adicionar ao PATH
scoop install git

# 4. Instalar Supabase CLI
scoop install supabase
```

### Opção 2: Download Manual

1. Acesse: https://github.com/supabase/cli/releases
2. Baixe a versão mais recente para Windows
3. Descompacte em: `C:\Program Files\supabase`
4. Adicione ao PATH do sistema

### Opção 3: Usar Winget (Windows 10/11)

```powershell
# Verificar se está disponível
winget search supabase

# Se encontrar, instale
winget install Supabase.CLI
```

### Opção 4: Via GitHub Direct

```powershell
# Baixar direto
Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe" -OutFile "supabase.exe"

# Mover para PATH
Move-Item supabase.exe C:\Windows\System32\
```

---

## 📋 Verificação

Após instalar, verifique:

```bash
# No CMD/PowerShell
supabase --version

# Ou
npx supabase --version
```

---

## 🔧 Configuração do MCP

O MCP já está instalado e configurado:

- ✅ `@supabase/mcp-server-supabase` instalado
- ✅ Arquivo `windsurf_mcp_config.json` criado
- ⏳ Precisa configurar no WindSurf

---

## 🎯 Próximos Passos

1. **Instale o Supabase CLI** (usando uma das opções acima)
2. **Configure o MCP no WindSurf**:
   - Settings → MCP Servers → Add Server
   - Use o arquivo `windsurf_mcp_config.json`
3. **Teste o MCP**:
   - Reinicie o WindSurf
   - Use `@supabase list_tables`

---

## 📝 Nota Importante

O **MCP do Supabase já está funcionando**! Você mencionou que está funcionando, então:

- ✅ MCP configurado e ativo
- ✅ Pode usar comandos `@supabase`
- ✅ CLI do Supabase é opcional (só para desenvolvimento local)

**Se o MCP já está funcionando, não precisa instalar o CLI!**
