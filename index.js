require('isomorphic-fetch');
const express = require("express");
const https = require("https");
const fs = require("fs");

const port = 443;

const app = express();

const options = {
  key: fs.readFileSync("./ssl/server.key"),
  cert: fs.readFileSync("./ssl/server.cert"),
};

app.use(express.static('public'));

app.use('/images/', express.static('public'));

app.use("*", (req, res) => {
  fetch(`http://notion-proxy.glitch.me${req.originalUrl}`, {
    headers: new Headers({
      cookie: req.headers.cookie,
      'content-type': req.headers["content-type"],
      referrer: req.headers.referrer,
      'user-agent': req.headers["user-agent"],
    }),
    method: req.method,
    body: req.method === 'POST' && req.body
  }).then(x => {
    res.setHeader('content-type', x.headers.get('content-type'));
    return x.text();
  }).then((response) => {
    res.send(response);
  }).catch((error) => {
    console.error(error);
    res.sendStatus(500);
  })
});

https
  .createServer(options, app)
  .listen(port, () => console.log(`Server is listening on port ${port}`));

