# 📋 Instruções para Aplicar Migrações no Supabase

## Passo a Passo

### 1. Acessar o Dashboard do Supabase

1. Abra o navegador e acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `rlaxbloitiknjikrpbim`

### 2. Abrir o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (Nova Consulta)

### 3. Executar Migração 001 (Tabelas Base)

1. Abra o arquivo: `supabase/migrations/001_initial_schema.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (Executar)
5. Aguarde a mensagem de sucesso

**⚠️ IMPORTANTE:** Esta migração cria todas as tabelas base do Elite Track:
- users, vehicles, projects, timeline_steps
- blinding_specs, blinding_materials
- support_tickets, notifications
- chat_messages, registration_invites
- E mais...

### 4. Executar Migração 002 (Tabelas Elite Gestão)

1. Clique em **New Query** novamente
2. Abra o arquivo: `supabase/migrations/002_elite_gestao_tables.sql`
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **Run** (Executar)
6. Aguarde a mensagem de sucesso

**⚠️ IMPORTANTE:** Esta migração cria as tabelas do Elite Gestão:
- leads, proposals, proposal_items
- contracts, contract_installments
- invoices, expenses, bank_accounts
- preowned_vehicles, preowned_photos
- E mais...

### 5. Verificar as Tabelas

Após executar ambas as migrações:

1. No menu lateral, clique em **Table Editor**
2. Verifique se todas as tabelas foram criadas
3. Você deve ver cerca de 30+ tabelas

### 6. Configurar Storage (Opcional)

Para upload de imagens e documentos:

1. No menu lateral, clique em **Storage**
2. Clique em **New Bucket**
3. Crie os buckets:
   - `vehicle-images` (público)
   - `documents` (privado)
   - `avatars` (público)

### 5. Executar Migração 003 (Correção RLS)

**⚠️ IMPORTANTE:** Esta migração corrige um problema de recursão infinita nas políticas RLS.

1. Clique em **New Query** novamente
2. Abra o arquivo: `supabase/migrations/003_fix_rls_recursion.sql`
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **Run** (Executar)

Esta migração:
- Corrige a recursão infinita na tabela `users`
- Cria uma função auxiliar `get_user_role()` para evitar recursão
- Configura políticas RLS corretas para `leads`

## ✅ Verificação Final

Execute esta query para verificar as tabelas criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver tabelas como:
- `users`, `vehicles`, `projects`
- `leads`, `proposals`, `contracts`
- `invoices`, `expenses`, `preowned_vehicles`

## 🔧 Solução de Problemas

### Erro: "relation already exists"
Se alguma tabela já existe, você pode:
1. Ignorar o erro (se a estrutura está correta)
2. Ou deletar a tabela e rodar novamente

### Erro: "permission denied"
Verifique se você está logado com a conta correta que tem acesso ao projeto.

### Erro: "syntax error"
Certifique-se de copiar TODO o conteúdo do arquivo SQL, incluindo os comentários.

---

## 📱 Próximos Passos

Após aplicar as migrações:

1. **Elite Track** - Está pronto para usar em `localhost:5173`
2. **Elite Gestão** - Execute `npm run dev` na pasta `Elite_Gestao` para iniciar em `localhost:5174`

Ambas as aplicações agora compartilham o mesmo banco de dados!
