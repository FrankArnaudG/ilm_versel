/* eslint-disable @typescript-eslint/no-require-imports */
// server.js - Serveur Next.js pour Phusion Passenger (o2switch)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const app = next({ dev, hostname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen('passenger', () => {
    console.log(`> Ready on passenger socket`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
  });
});










// const express = require('express');
// const next = require("next");

// const port = process.env.PORT || 3000;
// const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//     const server = express();

//     // Gérer toutes les routes Next.js
//     server.all('*', (req, res) => {
//         return handle(req, res);
//     })

//     server.listen(port, (err) => {
//         if (err) throw err;
//         console.log(`> Ready on http://localhost:${port}`);
//         console.log(`> Environment: ${dev ? 'development' : 'production'}`);
//     })
// });








// /* eslint-disable @typescript-eslint/no-require-imports */
// const { createServer } = require("http");
// const next = require("next");
// const { parse } = require("url");

// const port = process.env.PORT || 3000;
// const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   createServer((req, res) => {
//     const parsedUrl = parse(req.url, true);
//     handle(req, res, parsedUrl);
//   }).listen(port, (err) => {
//     if (err) throw err;
//     console.log(`> Ready on http://localhost:${port}`);
//   });
// });