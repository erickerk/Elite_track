# 📋 Guia de Configuração MCP - Windsurf

## ✅ MCPs Instalados com Sucesso

### 1. **Figma Remote MCP Server** ✅
- **Status:** Configurado
- **Uso:** Integração com Figma para design e protótipos
- **Como usar:** "Use o MCP do Figma para [ação]"

### 2. **Shadcn MCP** ✅
- **Status:** Configurado
- **Uso:** Componentes UI com Shadcn
- **Como usar:** "Use o MCP do Shadcn para [ação]"

### 3. **Context7 MCP** ⚠️
- **Status:** Configurado (NECESSITA API KEY)
- **Uso:** Documentação e código de bibliotecas
- **Ação necessária:** Substituir `YOUR_API_KEY` pela chave real

### 4. **Notion MCP** ✅
- **Status:** Configurado
- **Uso:** Integração com Notion
- **Como usar:** "Use o MCP do Notion para [ação]"

### 5. **Next.js DevTools MCP** ✅
- **Status:** Configurado
- **Uso:** Ferramentas de desenvolvimento Next.js
- **Como usar:** "Use o MCP do Next.js para [ação]"

### 6. **Flowbite MCP** ⚠️
- **Status:** Configurado (NECESSITA FIGMA TOKEN)
- **Uso:** Componentes UI Flowbite
- **Ação necessária:** Substituir `YOUR_PERSONAL_FIGMA_ACCESS_TOKEN`

### 7. **TailwindCSS MCP** ✅
- **Status:** Configurado
- **Uso:** Utilitários TailwindCSS
- **Como usar:** "Use o MCP do Tailwind para [ação]"

---

## 🔧 Configurações Necessárias

### Context7 - API Key
```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp", "--api-key", "SUA_CHAVE_AQUI"],
  "disabled": false,
  "env": {}
}
```

**Como obter API Key:**
1. Acesse: https://context7.ai
2. Crie conta e obtenha API Key
3. Substitua `YOUR_API_KEY` no config

### Flowbite - Figma Token
```json
"flowbite": {
  "command": "npx",
  "args": ["-y", "flowbite-mcp"],
  "disabled": false,
  "env": {
    "FIGMA_ACCESS_TOKEN": "SEU_FIGMA_TOKEN_AQUI"
  }
}
```

**Como obter Figma Token:**
1. Acesse: https://www.figma.com/developers/api#access-tokens
2. Gere um Personal Access Token
3. Substitua `YOUR_PERSONAL_FIGMA_ACCESS_TOKEN` no config

---

## 🚀 Como Testar os MCPs

### 1. **Figma**
```bash
# No Windsurf, digite:
"Use o MCP do Figma para obter informações do meu design"
```

### 2. **Shadcn**
```bash
# No Windsurf, digite:
"Use o MCP do Shadcn para adicionar um componente button"
```

### 3. **TailwindCSS**
```bash
# No Windsurf, digite:
"Use o MCP do Tailwind para gerar classes de cor"
```

### 4. **Next.js**
```bash
# No Windsurf, digite:
"Use o MCP do Next.js para verificar o status do projeto"
```

---

## 📝 Arquivo de Configuração

**Local:** `c:\Users\admin\.codeium\windsurf\mcp_config.json`

**MCPs Ativos:**
- ✅ Figma Remote
- ✅ Shadcn
- ⚠️ Context7 (precisa API key)
- ✅ Notion
- ✅ Next.js DevTools
- ⚠️ Flowbite (precisa Figma token)
- ✅ TailwindCSS
- ✅ Playwright
- ✅ Memory
- ✅ Sequential Thinking
- ✅ Supabase
- ✅ Pulumi
- ✅ Vercel
- ✅ Fetch

---

## 🔍 Verificação

Para verificar se os MCPs estão funcionando:

1. **Reinicie o Windsurf**
2. **Abra um novo chat**
3. **Teste com comandos simples**

**Exemplo de teste:**
- "Use o MCP do Tailwind para converter CSS para classes"
- "Use o MCP do Shadcn para listar componentes disponíveis"

---

## ⚠️ Importante

- **Context7** e **Flowbite** precisam de chaves de API para funcionar 100%
- **Outros MCPs** devem funcionar imediatamente após reiniciar o Windsurf
- **Reinicie o Windsurf** após alterar o config

---

**Status:** 🟢 Configuração concluída (com pendências de API keys)
