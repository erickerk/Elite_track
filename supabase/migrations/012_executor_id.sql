-- =====================================================
-- ELITE TRACK - ADICIONAR EXECUTOR_ID NA TABELA PROJECTS
-- Migração: 012_executor_id.sql
-- Data: 14/01/2025
-- =====================================================

-- Adicionar coluna executor_id para rastrear qual executor está responsável pelo projeto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para consultas por executor
CREATE INDEX IF NOT EXISTS idx_projects_executor_id ON projects(executor_id);

-- Comentário explicativo
COMMENT ON COLUMN projects.executor_id IS 'ID do executor atualmente responsável pelo projeto. Permite filtrar "Meus" projetos vs "Todos"';
