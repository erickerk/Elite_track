import https from 'https';
import fs from 'fs';

const token = 'sbp_d92a1b647685c1228839c685c792f56871e1f438';
const projectRef = 'rlaxbloitiknjikrpbim';

const sqlContent = fs.readFileSync('./supabase/migrations/004b_eliteshield_tables_only.sql', 'utf8');

console.log('🚀 Aplicando migração EliteShield™ no Supabase...\n');
console.log('Projeto: ' + projectRef);
console.log('Tamanho: ' + sqlContent.length + ' caracteres\n');

const postData = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/' + projectRef + '/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Status HTTP: ' + res.statusCode + '\n');
  
  res.on('data', chunk => data += chunk);
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ MIGRAÇÃO APLICADA COM SUCESSO!\n');
      console.log('Tabelas criadas:');
      console.log('  • blinding_lines');
      console.log('  • glass_specs');
      console.log('  • opaque_materials');
      console.log('  • warranty_types');
      console.log('  • technical_responsibles');
      console.log('  • eliteshield_reports');
      console.log('  • eliteshield_photos');
      console.log('  • eliteshield_execution_steps');
      console.log('');
      console.log('Triggers criados:');
      console.log('  • Proteção Admin Master');
      console.log('  • Auto-geração de tokens EliteTrace™');
      console.log('  • Updated_at automático');
    } else {
      console.log('❌ ERRO na migração');
      console.log('Status: ' + res.statusCode);
      console.log('Resposta:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro de conexão:', e.message);
});

req.write(postData);
req.end();
