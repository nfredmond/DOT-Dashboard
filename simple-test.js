const next = require('next');
const { createServer } = require('http');

const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('Next.js initialized successfully');
  createServer((req, res) => {
    handle(req, res);
  }).listen(3007, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3007');
  });
}); 