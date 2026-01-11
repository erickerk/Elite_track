-- =====================================================
-- ELITE TRACK - CRIAR FUNÇÃO PARA EXECUTAR SQL
-- Execute PRIMEIRO este arquivo no Supabase Dashboard
-- Depois execute SUPABASE_SETUP_SIMPLES.sql
-- =====================================================

-- Criar função para executar SQL (requer permissões de admin)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS TABLE(result TEXT) AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon, authenticated;
