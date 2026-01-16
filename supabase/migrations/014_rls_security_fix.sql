-- =====================================================
-- MIGRAÇÃO 014: CORREÇÃO DE SEGURANÇA - RLS
-- Data: 15/01/2026
-- Objetivo: Habilitar Row Level Security nas tabelas públicas
-- sem RLS detectadas pelo Security Advisor
-- =====================================================

-- Habilitar RLS nas 5 tabelas críticas
ALTER TABLE chat_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinding_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blinding_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_protections ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: chat_conversation_participants
-- =====================================================

-- Usuários veem apenas suas próprias participações
CREATE POLICY "Users see own chat participations"
ON chat_conversation_participants
FOR SELECT
USING (user_id = auth.uid());

-- Usuários podem se juntar a conversas
CREATE POLICY "Users join conversations"
ON chat_conversation_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS: price_items
-- =====================================================

-- Apenas admin e executor gerenciam itens de preço
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

-- =====================================================
-- POLÍTICAS: blinding_specs
-- =====================================================

-- Cliente vê specs dos seus projetos; admin/executor vê tudo
CREATE POLICY "Users see own project specs"
ON blinding_specs
FOR SELECT
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executor')
  )
);

-- Apenas executor e admin gerenciam specs
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

-- =====================================================
-- POLÍTICAS: blinding_materials
-- =====================================================

-- Cliente vê materiais dos seus projetos; admin/executor vê tudo
CREATE POLICY "Users see own project materials"
ON blinding_materials
FOR SELECT
USING (
  blinding_spec_id IN (
    SELECT id FROM blinding_specs
    WHERE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executor')
  )
);

-- Apenas executor e admin gerenciam materiais
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

-- =====================================================
-- POLÍTICAS: body_protections
-- =====================================================

-- Cliente vê proteções dos seus projetos; admin/executor vê tudo
CREATE POLICY "Users see own project protections"
ON body_protections
FOR SELECT
USING (
  blinding_spec_id IN (
    SELECT id FROM blinding_specs
    WHERE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executor')
  )
);

-- Apenas executor e admin gerenciam proteções
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

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Comentário: Execute a query abaixo manualmente para verificar
-- se ainda restam tabelas públicas sem RLS:
--
-- SELECT schemaname, tablename
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename NOT IN (
--     SELECT tablename FROM pg_policies WHERE schemaname = 'public'
--   )
-- ORDER BY tablename;
