-- =====================================================
-- FIX: Tornar colunas nullable para desenvolvimento
-- Migração: 005_fix_nullable_columns.sql
-- =====================================================

-- LEADS - Tornar created_by e assigned_to opcionais
ALTER TABLE leads ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN assigned_to DROP NOT NULL;

-- PROPOSALS - Tornar colunas de FK opcionais
ALTER TABLE proposals ALTER COLUMN created_by DROP NOT NULL;

-- CONTRACTS - Tornar colunas de FK opcionais  
ALTER TABLE contracts ALTER COLUMN created_by DROP NOT NULL;

-- INVOICES - Tornar colunas opcionais
ALTER TABLE invoices ALTER COLUMN created_by DROP NOT NULL;

-- EXPENSES - Tornar colunas opcionais
ALTER TABLE expenses ALTER COLUMN created_by DROP NOT NULL;
