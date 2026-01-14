# 🧪 Instruções para Testes - Elite Track

## ⚠️ PROBLEMA IDENTIFICADO

Os testes Playwright falharam porque:

1. **Usuário joao@teste.com não tem autenticação no Supabase Auth**
   - Tabela `users` tem o registro, mas Supabase Auth não
   - Login via UI falha com "Invalid credentials"

2. **QR Scanner requer permissão de câmera**
   - Playwright não pode conceder permissão de câmera automaticamente
   - Testes falham esperando que câmera abra

3. **Dashboard não carrega projetos sem login**
   - Sem autenticação válida, RLS bloqueia queries
   - ExecutorDashboard mostra 0 projetos

---

## ✅ CORREÇÕES APLICADAS

### 1. Dados no Supabase (✅ Concluído)

**Executar script:**
```bash
node scripts/create-test-users.mjs
```

**Resultado:**
- ✅ Executor João criado na tabela `users` (ID: 585965bd-9c6b-48ab-8cba-c7630ef7aee2)
- ✅ Projeto do Erick vinculado ao João via `executor_id`
- ✅ 1 projeto disponível: `QR-1768091798010-PERMANENT`

---

### 2. Autenticação Supabase Auth (⚠️ PENDENTE MANUAL)

**Você precisa criar a autenticação manualmente:**

1. Acesse o dashboard do Supabase:
   - URL: https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim
   - Navegue: Authentication → Users → Add User

2. **Criar usuário joao@teste.com:**
   ```
   Email: joao@teste.com
   Password: teste123
   Confirm: true (sem verificação de email)
   ```

3. **Criar usuário erick@teste.com:**
   ```
   Email: erick@teste.com
   Password: teste123
   Confirm: true
   ```

4. **Vincular UUID aos registros da tabela users:**
   - Copie o UUID gerado pelo Supabase Auth
   - Execute SQL no SQL Editor:
   
   ```sql
   -- Atualizar João
   UPDATE users 
   SET id = '<UUID-do-Supabase-Auth>'
   WHERE email = 'joao@teste.com';

   -- Atualizar Erick
   UPDATE users 
   SET id = '<UUID-do-Supabase-Auth>'
   WHERE email = 'erick@teste.com';

   -- Atualizar projects para usar o novo UUID do João
   UPDATE projects
   SET executor_id = '<UUID-do-João>'
   WHERE executor_id = '585965bd-9c6b-48ab-8cba-c7630ef7aee2';

   -- Atualizar projects para usar o novo UUID do Erick
   UPDATE projects
   SET user_id = '<UUID-do-Erick>'
   WHERE user_id = 'cf8430b1-3923-4c5d-b5ea-06b1a82dd74b';
   ```

---

### 3. Validar Manualmente (Antes de Rodar Testes)

**Passo a passo:**

1. **Iniciar dev server:**
   ```bash
   npm run dev
   ```
   - Server: http://localhost:5175

2. **Testar login como executor:**
   - URL: http://localhost:5175/login
   - Email: `joao@teste.com`
   - Senha: `teste123`
   - **Esperado:** Dashboard do executor com 1 projeto do Erick

3. **Verificar console do browser:**
   - F12 → Console
   - Procurar logs:
     - `[SupabaseAdapter] Buscando projetos do Supabase...`
     - `[SupabaseAdapter] 1 projetos encontrados`
     - `[ProjectContext] 1 projetos carregados do Supabase`

4. **Testar QR Scanner:**
   - Dashboard executor → Botão "Escanear" (amarelo, ícone QR)
   - URL esperada: `/scan?mode=project&autoStart=true`
   - **Esperado:** Câmera inicia automaticamente OU botão "Ativar Câmera" se falhar

5. **Testar consulta pública:**
   - URL: http://localhost:5175/
   - Clicar "Consulta Pública" → "Escanear QR Code"
   - **Esperado:** Scanner abre com câmera OU fallback manual

---

### 4. Testes Playwright (Após Validação Manual)

**Só execute depois que login manual funcionar!**

```bash
# Instalar browsers (se necessário)
npx playwright install

# Executar testes
npx playwright test tests/rca-critical-bugs.spec.ts --reporter=html

# Ver relatório
npx playwright show-report
```

**Nota:** Testes de câmera podem falhar em CI/CD sem permissões. Considere mockar `getUserMedia` ou usar flag `--browser-arg=--use-fake-device-for-media-stream`.

---

## 🐛 DEBUG: Se Projetos Não Carregarem

### Verificar RLS Policies

Execute no SQL Editor do Supabase:

```sql
-- Ver policies da tabela projects
SELECT * FROM pg_policies WHERE tablename = 'projects';

-- Verificar se executor pode ver projetos
SELECT 
  p.id,
  p.qr_code,
  p.executor_id,
  p.user_id,
  u.name as client_name,
  u.email as client_email
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE p.executor_id = '<UUID-do-João>';
```

### Verificar Logs do Browser

Console deve mostrar:
```
[ProjectContext] Carregando projetos do Supabase...
[SupabaseAdapter] Buscando projetos do Supabase...
[SupabaseAdapter] 1 projetos encontrados
  - QR-1768091798010-PERMANENT | User: Erick R | Executor: <UUID-João>
[ProjectContext] 1 projetos carregados do Supabase
[ProjectContext] ✓ Real-time conectado com sucesso!
```

Se aparecer `0 projetos`, verificar:
1. Auth token válido (localStorage key `sb-rlaxbloitiknjikrpbim-auth-token`)
2. RLS policies permitem acesso
3. executor_id está correto no banco

---

## 📝 Checklist de Validação

### Antes dos Testes Playwright:
- [ ] Usuário joao@teste.com existe no Supabase Auth
- [ ] Usuário erick@teste.com existe no Supabase Auth
- [ ] UUIDs da tabela `users` batem com Supabase Auth
- [ ] Projeto tem `executor_id` correto
- [ ] Login manual funciona para joao@teste.com
- [ ] Dashboard mostra 1 projeto do Erick
- [ ] Console do browser mostra logs do SupabaseAdapter

### Após Correções:
- [ ] Testes Playwright passam para Bug 2 e 3 (login funciona)
- [ ] Teste de QR Scanner pode falhar (permissão de câmera)
- [ ] Considerar mockar getUserMedia para CI/CD

---

## 🔧 Scripts Úteis

```bash
# Verificar dados no Supabase
node scripts/check-supabase-data.mjs

# Criar usuários de teste (tabela users apenas)
node scripts/create-test-users.mjs

# Dev server
npm run dev

# Build para produção
npm run build

# Testes Playwright
npx playwright test

# UI do Playwright (interativo)
npx playwright test --ui
```

---

## 📞 Suporte

Se os testes continuarem falhando após seguir estes passos:

1. Compartilhe screenshot do dashboard do Supabase Auth
2. Compartilhe console do browser durante login
3. Compartilhe output do script `check-supabase-data.mjs`

---

**Status:** ⏳ Aguardando criação manual de usuários no Supabase Auth
