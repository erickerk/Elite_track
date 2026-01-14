# Migração: Adicionar executor_id na Tabela Projects

## 📋 Descrição

Esta migração adiciona suporte para rastrear qual executor é responsável por cada projeto, permitindo o filtro "Meus" vs "Todos" e o botão "Tornar Meu".

## 🔧 SQL a Executar

```sql
-- Adicionar coluna executor_id para rastrear qual executor está responsável pelo projeto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para consultas por executor
CREATE INDEX IF NOT EXISTS idx_projects_executor_id ON projects(executor_id);

-- Comentário explicativo
COMMENT ON COLUMN projects.executor_id IS 'ID do executor atualmente responsável pelo projeto. Permite filtrar "Meus" projetos vs "Todos"';
```

## 📍 Como Executar

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse: https://app.supabase.com/project/rlaxbloitiknjikrpbim/sql/new
2. Cole o SQL acima no editor
3. Clique em **"Run"** (ou Ctrl+Enter)
4. Aguarde a confirmação de sucesso

### Opção 2: Via Script Node.js

```bash
node run_migration_executor_id.mjs
```

## ✅ Verificação

Após executar a migração, verifique se a coluna foi criada:

```sql
-- Verificar coluna
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'executor_id';

-- Verificar índice
SELECT indexname FROM pg_indexes WHERE tablename = 'projects' AND indexname = 'idx_projects_executor_id';
```

## 🎯 Impacto

### Tabela: `projects`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `executor_id` | UUID | ID do executor responsável pelo projeto |

### Índice

| Nome | Coluna | Uso |
|------|--------|-----|
| `idx_projects_executor_id` | `executor_id` | Otimizar consultas por executor |

## 🚀 Próximos Passos

1. ✅ Executar a migração SQL acima
2. Reiniciar o servidor: `npm run dev`
3. Fazer login como executor: `joao@teste.com` / `teste123`
4. Testar filtro "Meus" vs "Todos"
5. Testar botão "Tornar Meu" em um projeto

## 📝 Notas

- A coluna é **nullable** (pode ser NULL) para projetos sem executor atribuído
- O índice melhora performance de consultas por executor
- Compatível com projetos existentes (não afeta dados atuais)

## 🔗 Referências

- Migração: `supabase/migrations/012_executor_id.sql`
- Código TypeScript: `src/types/index.ts` (linha 157)
- Adapter: `src/services/storage/SupabaseAdapter.ts` (linha 57)
- Dashboard: `src/pages/ExecutorDashboard.tsx` (linhas 1041-1068)
