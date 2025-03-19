const express = require('express');
const next = require('next');
const path = require('path');
const fs = require('fs');

const port = parseInt(process.env.PORT, 10) || 3002;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Simple mocked response for API endpoints
const mockApiResponse = { success: true };

app.prepare().then(() => {
  const server = express();

  // Return mock data for API routes
  server.all('/api/*', (req, res) => {
    res.json(mockApiResponse);
  });

  // Serve our test hello page at the root
  server.get('/', (req, res) => {
    res.redirect('/hello');
  });

  // Let Next.js handle all other routes
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 