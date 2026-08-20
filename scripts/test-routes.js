const http = require('http');

const routes = ['/', '/labs', '/labs/a', '/leaderboard', '/admin/login', '/finish', '/products', '/api/feedback/stats'];

async function testRoute(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[STATUS ${res.statusCode}] ${path} (Length: ${data.length} bytes)`);
        resolve({ path, status: res.statusCode });
      });
    }).on('error', (err) => {
      console.error(`[ERROR] ${path}: ${err.message}`);
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing Next.js routes on localhost:3000...');
  for (const r of routes) {
    await testRoute(r);
  }
}

run();
