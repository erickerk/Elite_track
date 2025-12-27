-- =====================================================
-- FIX: Corrigir recursão infinita nas políticas RLS
-- Migração: 003_fix_rls_recursion.sql
-- Data: 27/12/2024
-- Problema: A política "Executors can view all users" 
--           faz subconsulta na própria tabela users,
--           causando recursão infinita
-- =====================================================

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Executors can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recriar políticas sem recursão
-- Usando auth.jwt() para obter o role diretamente do token JWT

-- Política: Usuário pode ver próprio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Política: Usuário pode atualizar próprio perfil  
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Política: Admins e Executors podem ver todos os usuários
-- Usando função security definer para evitar recursão
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.users WHERE id = user_id;
$$;

-- Política corrigida sem recursão
CREATE POLICY "Executors can view all users" ON users
    FOR SELECT USING (
        auth.uid() = id 
        OR public.get_user_role(auth.uid()) IN ('executor', 'admin')
    );

-- Verificar se RLS está habilitado na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Corrigir políticas em outras tabelas que podem ter 
-- o mesmo problema de recursão
-- =====================================================

-- Projects
DROP POLICY IF EXISTS "Executors can view all projects" ON projects;
CREATE POLICY "Executors can view all projects" ON projects
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.get_user_role(auth.uid()) IN ('executor', 'admin')
    );

DROP POLICY IF EXISTS "Executors can manage all projects" ON projects;
CREATE POLICY "Executors can manage all projects" ON projects
    FOR ALL USING (
        public.get_user_role(auth.uid()) IN ('executor', 'admin')
    );

-- Support Tickets
DROP POLICY IF EXISTS "Executors can view all tickets" ON support_tickets;
CREATE POLICY "Executors can view all tickets" ON support_tickets
    FOR SELECT USING (
        user_id = auth.uid()
        OR public.get_user_role(auth.uid()) IN ('executor', 'admin')
    );

DROP POLICY IF EXISTS "Executors can manage all tickets" ON support_tickets;
CREATE POLICY "Executors can manage all tickets" ON support_tickets
    FOR ALL USING (
        public.get_user_role(auth.uid()) IN ('executor', 'admin')
    );

-- =====================================================
-- Garantir que leads podem ser acessados
-- =====================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política temporária: permitir acesso anônimo para testes
-- REMOVER EM PRODUÇÃO e substituir por políticas adequadas
CREATE POLICY "Allow anon read leads" ON leads
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated all leads" ON leads
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- Comentário final
-- =====================================================
COMMENT ON FUNCTION public.get_user_role IS 'Função auxiliar para obter role do usuário sem causar recursão nas políticas RLS';
