const http = require('http');

// Login
const loginData = JSON.stringify({ email: 'owner@shieldtrack.com', password: 'Password123!' });
const loginOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    const jwt = JSON.parse(body).access_token;
    console.log('✓ Login successful');
    
    // Export CSV
    const exportOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/export/project/69667ada0c84ba78a9d75b13/csv',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${jwt}` }
    };
    
    http.get(exportOptions, (res) => {
      let csvData = '';
      res.on('data', (d) => { csvData += d; });
      res.on('end', () => {
        const lines = csvData.trim().split('\n');
        console.log('Total lines:', lines.length);
        console.log('Has data rows:', lines.length > 1 ? 'YES ✓' : 'NO ✗');
        if (lines.length > 1) {
          console.log('First data row preview:', lines[1].substring(0, 150));
          console.log('\nSUCCESS: CSV export is working! ✓✓✓');
        } else {
          console.log('ERROR: CSV is still empty');
        }
      });
    });
  });
});

loginReq.write(loginData);
loginReq.end();
