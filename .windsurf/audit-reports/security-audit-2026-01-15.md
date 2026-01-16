# 🔒 RELATÓRIO DE AUDITORIA DE SEGURANÇA - SUPABASE

**Data:** 15/01/2026  
**Projeto:** Elite Blindagens (Elite Track + Elite Gestão)  
**Banco:** Supabase (rlaxbloitiknjikrpbim)

---

## 📊 Resumo Executivo

| Métrica | Valor |
| ------- | ----- |
| Total de Warnings | 84 |
| Tipo Principal | RLS Disabled in Public |
| Severidade | ⚠️ Média-Alta |
| Ação Requerida | Habilitar RLS em tabelas públicas |

---

## 🚨 Alertas Detectados

Tabelas públicas sem RLS (Security Advisor):

1. `public.conversation_particip` (participantes de chat)
2. `public.price_items`
3. `public.blinding_specs`
4. `public.blinding_materials`
5. `public.body_protections`

Impacto: dados sensíveis acessíveis por qualquer usuário autenticado. As funcionalidades atuais não mudam; só adicionamos proteção por linha.

---

## 🛠️ Script de Correção (RLS)

> Aplicar no SQL Editor do Supabase. Não altera lógica da aplicação, apenas restringe acesso por usuário/role.

```sql
-- Habilitar RLS
ALTER TABLE chat_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinding_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinding_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_protections ENABLE ROW LEVEL SECURITY;

-- Participantes de chat: cada usuário vê apenas suas conversas
CREATE POLICY "Users see own chat participations"
ON chat_conversation_participants
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users join conversations"
ON chat_conversation_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Itens de preço: só admin e executor gerenciam
CREATE POLICY "Admins and executors manage price items"
ON price_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

-- Especificações: cliente vê o que é dele; admin/executor vê tudo
CREATE POLICY "Users see own project specs"
ON blinding_specs
FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

CREATE POLICY "Executors and admins manage specs"
ON blinding_specs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

-- Materiais: herdam specs
CREATE POLICY "Users see own project materials"
ON blinding_materials
FOR SELECT
USING (
  blinding_spec_id IN (
    SELECT id FROM blinding_specs 
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

CREATE POLICY "Executors and admins manage materials"
ON blinding_materials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

-- Proteções da carroceria: herdam specs
CREATE POLICY "Users see own project protections"
ON body_protections
FOR SELECT
USING (
  blinding_spec_id IN (
    SELECT id FROM blinding_specs 
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

CREATE POLICY "Executors and admins manage protections"
ON body_protections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'executor')
  )
);

-- Verificar se restam tabelas sem RLS
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE schemaname = 'public'
  )
ORDER BY tablename;
```

---

## ✅ Checklist de Ação

- [ ] Executar script acima no Supabase
- [ ] Validar que 5 tabelas agora têm RLS ativo
- [ ] Testar perfil Cliente: não deve ver dados de outros
- [ ] Testar perfil Executor/Admin: deve ver/gerenciar tudo
- [ ] Reavaliar Security Advisor (warnings devem cair)

---

## Sincronização e Funcionalidade

- RLS não altera fluxos da aplicação (uploads, chats, laudos continuam iguais).
- Realtime permanece funcionando; apenas restringe quem pode ler linhas no backend.
- URLs de storage e eventos continuam intactos.

---

## Conclusão

**Status Atual:** ⚠️ Vulnerabilidade Média-Alta (RLS faltando em 5 tabelas).  
**Ação Recomendada:** Aplicar políticas acima imediatamente.  
**Impacto no produto:** Nenhuma mudança funcional; apenas proteção de dados por usuário/role.
