-- =====================================================
-- FIX: Políticas RLS para INSERT em tabelas do Elite Gestão
-- Migração: 004_fix_insert_policies.sql
-- Data: 27/12/2024
-- =====================================================

-- =====================================================
-- LEADS - Permitir operações CRUD
-- =====================================================
DROP POLICY IF EXISTS "Allow anon read leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated all leads" ON leads;

-- Permitir leitura para todos (temporário para desenvolvimento)
CREATE POLICY "Allow all read leads" ON leads
    FOR SELECT USING (true);

-- Permitir insert para todos (temporário para desenvolvimento)
CREATE POLICY "Allow all insert leads" ON leads
    FOR INSERT WITH CHECK (true);

-- Permitir update para todos (temporário para desenvolvimento)
CREATE POLICY "Allow all update leads" ON leads
    FOR UPDATE USING (true);

-- Permitir delete para todos (temporário para desenvolvimento)
CREATE POLICY "Allow all delete leads" ON leads
    FOR DELETE USING (true);

-- =====================================================
-- PROPOSALS - Permitir operações CRUD
-- =====================================================
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read proposals" ON proposals
    FOR SELECT USING (true);

CREATE POLICY "Allow all insert proposals" ON proposals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update proposals" ON proposals
    FOR UPDATE USING (true);

CREATE POLICY "Allow all delete proposals" ON proposals
    FOR DELETE USING (true);

-- =====================================================
-- PROPOSAL_ITEMS
-- =====================================================
ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all proposal_items" ON proposal_items
    FOR ALL USING (true);

-- =====================================================
-- CONTRACTS - Permitir operações CRUD
-- =====================================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read contracts" ON contracts
    FOR SELECT USING (true);

CREATE POLICY "Allow all insert contracts" ON contracts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update contracts" ON contracts
    FOR UPDATE USING (true);

CREATE POLICY "Allow all delete contracts" ON contracts
    FOR DELETE USING (true);

-- =====================================================
-- CONTRACT_INSTALLMENTS
-- =====================================================
ALTER TABLE contract_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all contract_installments" ON contract_installments
    FOR ALL USING (true);

-- =====================================================
-- INVOICES - Permitir operações CRUD
-- =====================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all invoices" ON invoices
    FOR ALL USING (true);

-- =====================================================
-- EXPENSES - Permitir operações CRUD
-- =====================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all expenses" ON expenses
    FOR ALL USING (true);

-- =====================================================
-- BANK_ACCOUNTS
-- =====================================================
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all bank_accounts" ON bank_accounts
    FOR ALL USING (true);

-- =====================================================
-- COST_CENTERS
-- =====================================================
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all cost_centers" ON cost_centers
    FOR ALL USING (true);

-- =====================================================
-- PREOWNED_VEHICLES - Permitir operações CRUD
-- =====================================================
ALTER TABLE preowned_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all preowned_vehicles" ON preowned_vehicles
    FOR ALL USING (true);

-- =====================================================
-- PREOWNED_PHOTOS
-- =====================================================
ALTER TABLE preowned_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all preowned_photos" ON preowned_photos
    FOR ALL USING (true);

-- =====================================================
-- VEHICLES (tabela compartilhada)
-- =====================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all vehicles" ON vehicles;
CREATE POLICY "Allow all vehicles" ON vehicles
    FOR ALL USING (true);

-- =====================================================
-- PROJECTS (tabela compartilhada)
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all projects" ON projects;
CREATE POLICY "Allow all projects" ON projects
    FOR ALL USING (true);

-- =====================================================
-- USERS (permitir leitura e criação)
-- =====================================================
DROP POLICY IF EXISTS "Allow insert users" ON users;
CREATE POLICY "Allow insert users" ON users
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- NOTA: Estas políticas são TEMPORÁRIAS para desenvolvimento
-- Em PRODUÇÃO, substituir por políticas baseadas em autenticação:
-- - Verificar auth.uid() para operações do usuário logado
-- - Verificar role do usuário para operações administrativas
-- =====================================================
