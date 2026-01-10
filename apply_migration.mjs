import https from 'https';

const token = 'sbp_d92a1b647685c1228839c685c792f56871e1f438';
const projectRef = 'rlaxbloitiknjikrpbim';

// Ler o arquivo SQL
import fs from 'fs';
const sqlContent = fs.readFileSync('./supabase/migrations/004_production_users_eliteshield.sql', 'utf8');

console.log('🚀 Aplicando migração SQL 004 no Supabase...\n');
console.log('Projeto: ' + projectRef);
console.log('Tamanho do SQL: ' + sqlContent.length + ' caracteres\n');

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
  
  console.log('Status: ' + res.statusCode + '\n');
  
  res.on('data', chunk => data += chunk);
  
  res.on('end', () => {
    try {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ MIGRAÇÃO APLICADA COM SUCESSO!\n');
        
        if (data) {
          const json = JSON.parse(data);
          console.log('Resposta:');
          console.log(JSON.stringify(json, null, 2));
        }
      } else {
        console.log('⚠️ Status: ' + res.statusCode);
        console.log('Resposta:');
        console.log(data);
      }
    } catch (e) {
      console.log('Resposta raw:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro:', e.message);
});

req.write(postData);
req.end();
