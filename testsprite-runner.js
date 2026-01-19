#!/usr/bin/env node

/**
 * TestSprite CLI Runner
 * Script para executar testes usando TestSprite via CLI
 * Uso: node testsprite-runner.js [test-description]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração
const API_KEY = process.env.API_KEY || 'sk-user-tYeUg4wBMJKToQ-JeX4RTll1q-8b0d2m6Yac_wzNkoepeeNcHUuGW1Hafz6AkSXd8YhRAe0ntCb8-J1RziWI2Vq7P04odL8aVUqzaOD2AuLAc8WN0e-Ws7sz_NLgJK_rU4U';
const PROJECT_PATH = __dirname;
const BASE_URL = 'http://localhost:5176';

// Descrição do teste (pode ser passada como argumento)
const testDescription = process.argv[2] || 'Teste de validação da aplicação Elite Track';

console.log('🚀 Iniciando TestSprite Runner...');
console.log(`📝 Descrição do teste: ${testDescription}`);
console.log(`🌐 URL base: ${BASE_URL}`);
console.log(`📁 Projeto: ${PROJECT_PATH}`);
console.log('');

// Executar TestSprite CLI
const testsprite = spawn('npx', ['@testsprite/testsprite-mcp@latest', 'generateCodeAndExecute'], {
  env: {
    ...process.env,
    API_KEY: API_KEY,
    TEST_DESCRIPTION: testDescription,
    BASE_URL: BASE_URL,
    PROJECT_PATH: PROJECT_PATH
  },
  stdio: 'inherit',
  shell: true
});

testsprite.on('error', (error) => {
  console.error('❌ Erro ao executar TestSprite:', error.message);
  process.exit(1);
});

testsprite.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Testes executados com sucesso!');
  } else {
    console.log(`❌ Testes finalizados com código de erro: ${code}`);
  }
  process.exit(code);
});
