# 🧪 Como Executar TestSprite - Elite Track

## ✅ Configuração Completa

Seu projeto já está configurado com:

- ✅ **TestSprite MCP instalado** (`@testsprite/testsprite-mcp@0.0.19`)
- ✅ **API Key configurada** (`.env.testsprite`)
- ✅ **PRD documentado** (`PRD-ELITE-TRACK-v2.md`)
- ✅ **Configuração de testes** (`testsprite.config.json`)
- ✅ **Scripts prontos** (`run-testsprite.bat`, `run-testsprite.sh`)

---

## 🚀 MÉTODO RECOMENDADO: Via Windsurf MCP

O TestSprite funciona melhor quando executado através do **Model Context Protocol (MCP)** integrado ao Windsurf.

### Passo 1: Verificar MCP do TestSprite

No Windsurf, o TestSprite MCP deve estar configurado em:

```
C:\Users\admin\.windsurf\mcp_settings.json
```

### Passo 2: Executar via Chat do Windsurf

Simplesmente peça ao assistente do Windsurf:

```
"Execute testes de segurança com TestSprite usando o PRD-ELITE-TRACK-v2.md"
```

Ou mais específico:

```
"Use TestSprite MCP para testar:
1. Autenticação e autorização
2. Proteção contra IDOR
3. Validação de input (XSS, SQL Injection)
4. Políticas RLS do Supabase
5. Segurança de upload de arquivos"
```

---

## 📋 Áreas de Teste Prioritárias

### 🔐 Segurança Crítica

1. **Autenticação**
   - Força bruta no login
   - Expiração de sessão (24h)
   - Senhas temporárias (4 dígitos, 7 dias)
   - Device ID

2. **Autorização (RBAC)**
   - Acesso entre perfis (client/executor/admin)
   - IDOR em projetos
   - Escalação de privilégios

3. **Input Validation**
   - XSS em campos de texto
   - SQL Injection
   - Upload de arquivos maliciosos
   - CSRF

4. **API/Database**
   - RLS do Supabase
   - Acesso direto às tabelas
   - Rate limiting

5. **Storage**
   - Acesso a fotos de outros projetos
   - Path traversal
   - Validação de tipo de arquivo

---

## 🎯 Fluxos Críticos para Testar

### 1. Login Flow
```
URL: https://elite-track.vercel.app/login
Credenciais: Joao@teste.com / Teste@2025
Validar: Redirecionamento, sessão, device ID
```

### 2. Criação de Projeto
```
Executor cria projeto → QR Code gerado → Senha temp criada
Validar: Dados salvos, QR único, senha segura
```

### 3. Upload de Fotos
```
Selecionar projeto → Adicionar foto → Upload
Validar: Tipo de arquivo, tamanho, acesso isolado
```

### 4. Acesso Cliente
```
Cliente loga → Vê apenas seu projeto → Não acessa outros
Validar: IDOR, RLS, autorização
```

---

## 📊 Credenciais de Teste

```json
{
  "executor": {
    "email": "Joao@teste.com",
    "password": "Teste@2025",
    "role": "executor"
  },
  "client": {
    "email": "erick@teste.com",
    "password": "Teste@2025",
    "role": "client"
  },
  "admin": {
    "email": "juniorrodrigues1011@gmail.com",
    "role": "admin"
  }
}
```

---

## 🔍 O Que o TestSprite Vai Verificar

### ✅ Testes Automáticos

- [ ] **Autenticação**: Força bruta, sessão, tokens
- [ ] **Autorização**: RBAC, IDOR, privilégios
- [ ] **Input**: XSS, SQLi, validação
- [ ] **API**: RLS, endpoints, rate limit
- [ ] **Storage**: Acesso, tipos, paths
- [ ] **Performance**: Tempos de resposta
- [ ] **Compliance**: WCAG, browsers, mobile

### 📝 Relatório Gerado

O TestSprite vai gerar:

1. **Vulnerabilidades encontradas** (críticas, médias, baixas)
2. **Fluxos testados** (passou/falhou)
3. **Recomendações de correção**
4. **Score de segurança**
5. **Relatório HTML/Markdown**

---

## 🛠️ Alternativa: Linha de Comando

Se preferir executar manualmente (não recomendado):

### Windows
```bash
.\run-testsprite.bat
```

### Linux/Mac
```bash
chmod +x run-testsprite.sh
./run-testsprite.sh
```

**Nota**: O método via MCP é mais confiável e integrado.

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `PRD-ELITE-TRACK-v2.md` | Documento de requisitos |
| `testsprite.config.json` | Configuração de testes |
| `.env.testsprite` | API Key |
| `TESTSPRITE-GUIDE.md` | Guia completo |

---

## 🎯 Próximos Passos

1. ✅ **Executar TestSprite via Windsurf MCP**
2. ⏳ **Aguardar conclusão dos testes** (5-15 minutos)
3. 📊 **Revisar relatório gerado**
4. 🔧 **Corrigir vulnerabilidades encontradas**
5. ✅ **Re-executar para validar correções**

---

## 💡 Dica

Para melhores resultados, execute o TestSprite com a aplicação em **produção**:

```
URL: https://elite-track.vercel.app
```

Isso garante testes em ambiente real com todas as configurações de segurança ativas.

---

## 📞 Suporte

- **Documentação**: `TESTSPRITE-GUIDE.md`
- **Testes E2E**: `tests/e2e/`
- **PRD Completo**: `PRD-ELITE-TRACK-v2.md`

---

**✅ PRONTO PARA EXECUTAR TESTES DE SEGURANÇA COM TESTSPRITE!**

**Comando sugerido para o Windsurf:**

> "Use o TestSprite MCP para executar testes de segurança completos na aplicação Elite Track em produção (https://elite-track.vercel.app), focando em autenticação, autorização RBAC, proteção IDOR, validação de input (XSS/SQLi), políticas RLS do Supabase e segurança de upload de arquivos. Use as credenciais do testsprite.config.json e o PRD-ELITE-TRACK-v2.md como referência."
