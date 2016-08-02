import test from 'ava';

import options from './webpack.config.js';
import { compileWebpack } from '../../utils.js';

test('Compiles deeply nested routes', async t => {
  const stats = await compileWebpack(options);
  const files = stats.toJson().assets.map(x => x.name);

  t.true(files.includes('products/third.html'));
  t.true(files.includes('products.html'));
  t.true(files.includes('products/first.html'));
  t.true(files.includes('products/second.html'));
  t.true(files.includes('products/third/colors.html'));
  t.true(files.includes('products/third/colors/green.html'));
  t.true(files.includes('products/third/colors/blue.html'));
  t.true(files.includes('index.html'));
  t.true(files.includes('about.html'));
  t.true(files.includes('404.html'));
});
