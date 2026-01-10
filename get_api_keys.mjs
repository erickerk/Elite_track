import https from 'https';

const token = 'sbp_d92a1b647685c1228839c685c792f56871e1f438';
const projectRef = 'rlaxbloitiknjikrpbim';

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/' + projectRef + '/api-keys',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('API Keys:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Erro ao parsear:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Erro:', e.message);
});

req.end();
