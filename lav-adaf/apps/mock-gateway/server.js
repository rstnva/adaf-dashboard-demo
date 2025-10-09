const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'mock-gateway' }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Mock Gateway running on port ${PORT}`);
});
