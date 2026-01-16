-- =====================================================
-- MIGRAÇÃO 015: CORREÇÃO DE NOME DE TABELA
-- Data: 15/01/2026
-- Objetivo: Corrigir referência incorreta ao nome da tabela
-- A tabela real é 'conversation_participants', não 'chat_conversation_participants'
-- =====================================================

-- Remover políticas criadas com nome incorreto (se existirem)
DROP POLICY IF EXISTS "Users see own chat participations" ON chat_conversation_participants;
DROP POLICY IF EXISTS "Users join conversations" ON chat_conversation_participants;

-- Habilitar RLS na tabela CORRETA
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: conversation_participants (NOME CORRETO)
-- =====================================================

-- Usuários veem apenas suas próprias participações
CREATE POLICY "Users see own chat participations"
ON conversation_participants
FOR SELECT
USING (user_id = auth.uid());

-- Usuários podem se juntar a conversas
CREATE POLICY "Users join conversations"
ON conversation_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admin e executores veem todas as participações
CREATE POLICY "Admins and executors see all participations"
ON conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executor')
  )
);
