# 🧪 Guia de Testes com TestSprite - Elite Track

## 📋 Visão Geral

TestSprite é uma ferramenta de testes de segurança automatizados que valida vulnerabilidades, fluxos críticos e conformidade de segurança da aplicação.

---

## 🔧 Configuração

### 1. Pré-requisitos

- ✅ Node.js instalado
- ✅ TestSprite MCP instalado (`@testsprite/testsprite-mcp@0.0.19`)
- ✅ API Key configurada (`.env.testsprite`)
- ✅ Aplicação em produção (https://elite-track.vercel.app)

### 2. Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `.env.testsprite` | API Key do TestSprite |
| `testsprite.config.json` | Configuração de testes |
| `PRD-ELITE-TRACK-v2.md` | Documento de requisitos |
| `run-testsprite.bat` | Script Windows |
| `run-testsprite.sh` | Script Linux/Mac |

---

## 🚀 Como Executar

### Opção 1: Script Automático (Windows)

```bash
.\run-testsprite.bat
```

Ou com descrição customizada:

```bash
.\run-testsprite.bat "Teste de segurança completo"
```

### Opção 2: Script Automático (Linux/Mac)

```bash
chmod +x run-testsprite.sh
./run-testsprite.sh
```

### Opção 3: Node.js Direto

```bash
node testsprite-runner.js
```

Ou:

```bash
node testsprite-runner.js "Teste de autenticação e autorização"
```

### Opção 4: NPX Direto

```bash
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
```

---

## 🔐 Categorias de Testes

### 1. **Autenticação**
- ✅ Proteção contra força bruta no login
- ✅ Expiração de sessão (24h)
- ✅ Validação de força de senha
- ✅ Segurança de senha temporária (4 dígitos, 7 dias)
- ✅ Validação de Device ID

### 2. **Autorização**
- ✅ RBAC (client, executor, admin)
- ✅ Prevenção de IDOR (acesso a projetos)
- ✅ Prevenção de escalação de privilégios
- ✅ Manipulação de role no frontend

### 3. **Validação de Input**
- ✅ XSS em campos de texto
- ✅ SQL Injection
- ✅ Validação de upload (tipo, tamanho)
- ✅ Proteção CSRF

### 4. **Segurança de API**
- ✅ Políticas RLS do Supabase
- ✅ Prevenção de acesso direto às tabelas
- ✅ Proteção de endpoints não autenticados
- ✅ Rate limiting

### 5. **Segurança de Storage**
- ✅ Controle de acesso a fotos
- ✅ Validação de tipo de arquivo
- ✅ Prevenção de path traversal
- ✅ Segurança de URLs de storage

---

## 🎯 Fluxos Críticos Testados

### 1. Login Flow
```
/login → Credenciais → Validação → /dashboard
```

### 2. Criação de Projeto
```
Novo Projeto → Dados Cliente → Dados Veículo → Foto → QR Code → Senha Temp
```

### 3. Upload de Fotos
```
Selecionar Projeto → Adicionar Foto → Tipo → Upload → Validação → Display
```

### 4. Atualização de Timeline
```
Selecionar Projeto → Expandir Etapa → Iniciar → Fotos → Observações → Concluir
```

---

## 📊 Métricas de Performance

| Operação | Meta | Status |
|----------|------|--------|
| Dashboard Load | < 3s | ✅ 163ms |
| Login Response | < 10s | ✅ 527ms |
| Photo Upload (5MB) | < 5s | ✅ |
| Navigation | < 2s | ✅ 567ms |

---

## 🔑 Credenciais de Teste

### Executor
```
Email: Joao@teste.com
Senha: Teste@2025
Role: executor
```

### Cliente
```
Email: erick@teste.com
Senha: Teste@2025
Role: client
```

### Admin
```
Email: juniorrodrigues1011@gmail.com
Role: admin
```

---

## 📝 Interpretando Resultados

### ✅ Teste Passou
- Vulnerabilidade não encontrada
- Fluxo funciona corretamente
- Segurança implementada

### ⚠️ Aviso
- Possível vulnerabilidade
- Requer revisão manual
- Melhoria recomendada

### ❌ Teste Falhou
- Vulnerabilidade confirmada
- Correção necessária
- Risco de segurança

---

## 🛠️ Troubleshooting

### Erro: "API_KEY not found"
```bash
# Verificar se .env.testsprite existe
cat .env.testsprite

# Ou definir manualmente
export API_KEY=sk-user-...
```

### Erro: "Cannot connect to application"
```bash
# Verificar se aplicação está rodando
curl https://elite-track.vercel.app

# Ou usar localhost
BASE_URL=http://localhost:5173 node testsprite-runner.js
```

### Erro: "TestSprite not installed"
```bash
# Reinstalar TestSprite
npm install @testsprite/testsprite-mcp@latest
```

---

## 📚 Documentação Adicional

- **PRD Completo:** `PRD-ELITE-TRACK-v2.md`
- **Testes E2E:** `tests/e2e/`
- **Relatórios:** `testsprite_tests/`

---

## 🎯 Próximos Passos

1. ✅ Executar testes de segurança
2. ✅ Revisar relatório gerado
3. ✅ Corrigir vulnerabilidades encontradas
4. ✅ Re-executar testes
5. ✅ Validar correções

---

## 📞 Suporte

- **GitHub:** erickerk/Elite_track
- **Vercel:** elite-track.vercel.app
- **TestSprite Docs:** https://testsprite.com/docs

---

**✅ APLICAÇÃO PRONTA PARA TESTES DE SEGURANÇA COM TESTSPRITE**
