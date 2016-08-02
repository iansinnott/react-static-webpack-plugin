import test from 'ava';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';

import options from './webpack.config.prod.js';

let stats;

test.cb.before(t => {
  webpack(options, (err, _stats) => {
    if (err) {
      return t.end(err);
    } else if (_stats.hasErrors()) {
      return t.end(_stats.toString());
    }

    stats = _stats;

    t.end();
  });
});

test.cb('Outputs the desired files', t => {
  const { assets } = stats.toJson();
  const files = assets.map(x => x.name);

  t.true(files.includes('index.html'));
  t.true(files.includes('who.html'));
  t.true(files.includes('how.html'));
  t.true(files.includes('log-in.html'));
  t.true(files.includes('sign-up.html'));
  t.true(files.includes('404.html'));
  t.true(files.includes('app.css'));
  t.true(files.includes('app.js'));

  t.end();
});

test.cb('Supports redux apps that must be wrapped in <Provider>', t => {
  const outputFilepath = path.join(options.output.path, 'index.html');
  const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });

  t.true(outputFileContents.includes('window.__initial_state'));
  t.true(outputFileContents.includes('Testable Title for Thing 0'));
  t.true(outputFileContents.includes('Testable Title for Thing 1'));
  t.true(outputFileContents.includes('Testable Title for Thing 2'));

  t.end();
});

test.cb('Bundle was minified', t => {
  const { assets } = stats.toJson();
  const files = assets.map(x => x.name);
  const bundle = assets[files.indexOf('app.js')];

  t.true((bundle.size / 1000) < 500);

  t.end();
});
