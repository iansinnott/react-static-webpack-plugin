import test from 'ava';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';

import options from './webpack.config.js';

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

test.cb('Compiles routes nested at one level', t => {
  const files = stats.toJson().assets.map(x => x.name);

  t.true(files.includes('index.html'));
  t.true(files.includes('about.html'));
  t.true(files.includes('404.html'));

  t.end();
});

test.cb('Output files contain titles specified in routes file', t => {
  const outputFilepath = path.join(options.output.path, 'index.html');
  const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });

  t.true(outputFileContents.includes('<title>App</title>'));

  t.end();
});
