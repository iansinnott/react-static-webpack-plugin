import test from 'ava';
import fs from 'fs';
import path from 'path';

import options from './webpack.config.js';
import { compileWebpack } from '../../utils.js';

let stats;

test.before(async t => {
  stats = await compileWebpack(options);
});

test('Compiles routes nested at one level', t => {
  const files = stats.toJson().assets.map(x => x.name);

  t.true(files.includes('index.html'));
  t.true(files.includes('about.html'));
  t.true(files.includes('404.html'));
});

test('Output files contain titles specified in routes file', t => {
  const outputFilepath = path.join(options.output.path, 'index.html');
  const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });

  t.true(outputFileContents.includes('<title>App</title>'));
});
