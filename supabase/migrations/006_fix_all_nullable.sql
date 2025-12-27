-- =====================================================
-- FIX FINAL: Todas as colunas nullable para desenvolvimento
-- Migração: 006_fix_all_nullable.sql
-- =====================================================

-- PROPOSALS
ALTER TABLE proposals ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE proposals ALTER COLUMN proposal_number DROP NOT NULL;

-- CONTRACTS
ALTER TABLE contracts ALTER COLUMN contract_number DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN proposal_id DROP NOT NULL;

-- PREOWNED_VEHICLES
ALTER TABLE preowned_vehicles ALTER COLUMN created_by DROP NOT NULL;

-- Garantir que todas as tabelas têm defaults seguros
ALTER TABLE proposals ALTER COLUMN proposal_number SET DEFAULT 'PROP-' || to_char(NOW(), 'YYYY-MM-DD-HH24MISS');
ALTER TABLE contracts ALTER COLUMN contract_number SET DEFAULT 'CONT-' || to_char(NOW(), 'YYYY-MM-DD-HH24MISS');
