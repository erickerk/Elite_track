#!/usr/bin/env node
/**
 * SUPABASE MCP HELPER
 * Script para interagir com o Supabase via MCP
 * Usa o @supabase/mcp-server-supabase instalado globalmente
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler configuração do .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
const tokenMatch = envContent.match(/SUPABASE_TOKEN=(.+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const ANON_KEY = anonKeyMatch ? anonKeyMatch[1].trim() : '';
const ACCESS_TOKEN = tokenMatch ? tokenMatch[1].trim() : '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Comandos disponíveis
const commands = {
  'list-tables': listTables,
  'exec-sql': executeSQL,
  'query': queryTable,
  'insert': insertData,
  'update': updateData,
  'delete': deleteData,
  'setup': setupProject,
  'help': showHelp
};

async function listTables() {
  console.log('📋 Listando tabelas do Supabase...\n');
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log('Tabelas encontradas:');
  data?.forEach(t => console.log(`  • ${t.table_name}`));
}

async function queryTable(table, limit = 10) {
  console.log(`🔍 Consultando ${limit} registros de: ${table}\n`);
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(limit);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log(JSON.stringify(data, null, 2));
}

async function insertData(table, jsonData) {
  console.log(`➕ Inserindo dados em: ${table}\n`);
  
  const data = JSON.parse(jsonData);
  const { error } = await supabase
    .from(table)
    .insert(data);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log('✅ Dados inseridos com sucesso');
}

async function updateData(table, id, jsonData) {
  console.log(`✏️  Atualizando registro ${id} em: ${table}\n`);
  
  const data = JSON.parse(jsonData);
  const { error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log('✅ Registro atualizado com sucesso');
}

async function deleteData(table, id) {
  console.log(`🗑️  Deletando registro ${id} de: ${table}\n`);
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log('✅ Registro deletado com sucesso');
}

async function executeSQL(sqlFile) {
  console.log(`🚀 Executando SQL de: ${sqlFile}\n`);
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Arquivo SQL não encontrado:', sqlFile);
    return;
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  
  console.log('📝 SQL a ser executado:');
  console.log(sql.substring(0, 200) + '...\n');
  
  console.log('⚠️  Execute este SQL manualmente no Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/rlaxbloitiknjikrpbim/sql');
}

async function setupProject() {
  console.log('🔧 Configurando projeto Supabase...\n');
  
  // Verificar se já existe configuração
  const configPath = path.join(__dirname, '.supabase', 'config.toml');
  
  if (fs.existsSync(configPath)) {
    console.log('✅ Projeto já configurado');
    return;
  }
  
  console.log('📦 Criando estrutura do projeto...');
  
  // Criar diretório .supabase
  const supabaseDir = path.join(__dirname, '.supabase');
  if (!fs.existsSync(supabaseDir)) {
    fs.mkdirSync(supabaseDir, { recursive: true });
  }
  
  // Criar config.toml
  const config = `[project]
name = "Elite Track"
id = "rlaxbloitiknjikrpbim"

[api]
url = "${SUPABASE_URL}"
anon_key = "${ANON_KEY}"

[db]
url = "${SUPABASE_URL}"
`;
  
  fs.writeFileSync(configPath, config);
  console.log('✅ Projeto configurado com sucesso');
  console.log('📁 Configuração salva em:', configPath);
}

function showHelp() {
  console.log(`
🛠️  SUPABASE MCP HELPER - Comandos Disponíveis

📋 Listagem:
  node supabase_mcp_helper.mjs list-tables
    Lista todas as tabelas do banco

🔍 Consultas:
  node supabase_mcp_helper.mjs query <tabela> [limite]
    Consulta registros de uma tabela
    Exemplo: node supabase_mcp_helper.mjs query projects 5

➕ Inserção:
  node supabase_mcp_helper.mjs insert <tabela> '<json>'
    Insere dados em uma tabela
    Exemplo: node supabase_mcp_helper.mjs insert users '{"name":"João"}'

✏️  Atualização:
  node supabase_mcp_helper.mjs update <tabela> <id> '<json>'
    Atualiza um registro
    Exemplo: node supabase_mcp_helper.mjs update users abc-123 '{"name":"Maria"}'

🗑️  Deleção:
  node supabase_mcp_helper.mjs delete <tabela> <id>
    Deleta um registro
    Exemplo: node supabase_mcp_helper.mjs delete users abc-123

🚀 SQL:
  node supabase_mcp_helper.mjs exec-sql <arquivo.sql>
    Prepara um arquivo SQL para execução
    Exemplo: node supabase_mcp_helper.mjs exec-sql migration.sql

🔧 Setup:
  node supabase_mcp_helper.mjs setup
    Configura o projeto Supabase localmente

❓ Ajuda:
  node supabase_mcp_helper.mjs help
    Mostra esta mensagem

📝 Configuração Global MCP:
  O MCP do Supabase está configurado em:
  C:\\Users\\admin\\.windsurf\\mcp_settings.json

💡 Dica: Para usar o MCP do Supabase, basta mencioná-lo no chat:
  "Use o MCP do Supabase para listar tabelas"
  "Com o MCP do Supabase, insira um registro em projects"
`);
}

// Executar comando
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  showHelp();
  process.exit(0);
}

commands[command](...args).catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
