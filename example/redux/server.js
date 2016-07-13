/**
 * NOTE: This file must be run with babel-node as Node is not yet compatible
 * with all of ES6 and we also use JSX.
 */
import http from 'http';
import url from 'url';
import express from 'express';
import webpack from 'webpack';

import config from './webpack.config.dev.js';
import { renderDocumentToString } from './render-to-document-string.js';

const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath,
}));

app.use(require('webpack-hot-middleware')(compiler));

// Send the boilerplate HTML payload down for all get requests. Routing will be
// handled entirely client side and we don't make an effort to pre-render pages
// before they are served when in dev mode.
app.get('*', (req, res) => {
  const html = renderDocumentToString({
    bundle: config.output.publicPath + 'app.js',
  });
  res.send(html);
});

// NOTE: url.parse can't handle URLs without a protocol explicitly defined. So
// if we parse '//localhost:8888' it doesn't work. We manually add a protocol even
// though we are only interested in the port.
const { port } = url.parse('http:' + config.output.publicPath);

const server = http.createServer(app);

server.listen(port, 'localhost', (err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(`Dev server listening at http://localhost:${port}`);
});
