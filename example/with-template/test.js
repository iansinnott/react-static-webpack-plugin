import test from 'ava';
import path from 'path';
import fs from 'fs';

import options from './webpack.config.js';
import { compileWebpack } from '../../utils.js';

test('Supports custom JSX template files', async t => {
  await compileWebpack(options);

  const outputFilepath = path.join(options.output.path, 'index.html');
  const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });

  t.true(outputFileContents.includes('Super awesome package'));
});
