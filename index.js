require('isomorphic-fetch');
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');

const port = 443;

const app = express();

const options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
};

app.use(express.static('public'));

app.use('/images/', express.static('public'));

app.use(express.json());

const getFilteredHeaders = (headers) => {
  const excludeHeaders = ['host'];
  return Object.keys(headers).reduce((acc, key) => {
    if (excludeHeaders.indexOf(key) === -1) {
      acc[key] = headers[key];
    }
    return acc;
  }, {});
};

app.use('*', (req, res) => {
  fetch(`http://notion-proxy.glitch.me${req.originalUrl}`, {
    headers: new Headers(getFilteredHeaders(req.headers)),
    method: req.method,
    body: JSON.stringify(req.body),
    credentials: 'include',
  })
    .then((x) => {
      const setCookieHeaders = [];
      const includeHeaders = ['content-type'];
      x.headers.forEach((val, k) => {
        if (includeHeaders.indexOf(k) > -1) {
          res.setHeader(k, val);
        } else if (k === 'set-cookie') {
          setCookieHeaders.push(val);
        }
      });
      if (setCookieHeaders.length > 0) {
        res.setHeader('set-cookie', setCookieHeaders);
      }
      return x.text();
    })
    .then((response) => {
      res.send(response);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

https
  .createServer(options, app)
  .listen(port, () => console.log(`Server is listening on port ${port}`));
