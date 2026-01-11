#!/usr/bin/env node
import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log('🔧 Testando MCP Server do Supabase...\n');

// Ler configuração do .env
const fs = await import('fs');
const path = await import('path');
const { fileURLToPath } = await import('url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const anonKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

const SUPABASE_URL = urlMatch ? urlMatch[1].trim() : '';
const ANON_KEY = anonKeyMatch ? anonKeyMatch[1].trim() : '';

console.log('📋 Configuração:');
console.log('URL:', SUPABASE_URL);
console.log('ANON_KEY:', ANON_KEY.substring(0, 20) + '...\n');

// Configurar variáveis de ambiente para o MCP server
const env = {
  ...process.env,
  SUPABASE_URL: SUPABASE_URL,
  SUPABASE_ANON_KEY: ANON_KEY,
};

// Iniciar MCP server
console.log('🚀 Iniciando MCP Server...');
const mcpProcess = spawn('npx', ['@supabase/mcp-server-supabase'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: env
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Enviar comandos MCP
const commands = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } },
  { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'execute_sql', arguments: { query: 'SELECT 1 as test;' } } }
];

let commandIndex = 0;

mcpProcess.stdout.on('data', (data) => {
  const response = data.toString();
  console.log('📨 Resposta MCP:', response);
  
  // Enviar próximo comando
  if (commandIndex < commands.length) {
    const cmd = commands[commandIndex];
    console.log('📤 Enviando comando:', cmd.method || cmd.id);
    mcpProcess.stdin.write(JSON.stringify(cmd) + '\n');
    commandIndex++;
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error('❌ Erro MCP:', data.toString());
});

mcpProcess.on('close', (code) => {
  console.log(`\n🔚 MCP Server encerrado com código: ${code}`);
  
  if (code === 0) {
    console.log('\n✅ MCP Server funcionando!');
    console.log('\n📝 Para usar no WindSurf:');
    console.log('1. Vá para Settings > MCP Servers');
    console.log('2. Adicione: @supabase/mcp-server-supabase');
    console.log('3. Configure com SUPABASE_URL e SUPABASE_ANON_KEY');
  } else {
    console.log('\n❌ MCP Server não funcionou');
    console.log('\n📝 Alternativas:');
    console.log('1. Use SQL Editor manual do Supabase');
    console.log('2. Instale Supabase CLI via outros métodos');
  }
});

// Enviar primeiro comando
setTimeout(() => {
  const cmd = commands[commandIndex];
  console.log('📤 Enviando comando inicial:', cmd.method);
  mcpProcess.stdin.write(JSON.stringify(cmd) + '\n');
  commandIndex++;
}, 1000);

// Encerrar após 10 segundos
setTimeout(() => {
  mcpProcess.kill();
}, 10000);
