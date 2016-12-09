import test from 'ava';
import path from 'path';
import fs from 'fs';

import options from './webpack.config.js';
import { compileWebpack } from '../../utils.js';

const readFile = (filepath) => fs.readFileSync(filepath, { encoding: 'utf8' });

test('Supports custom JSX template files', async t => {
  await compileWebpack(options);

  const filepath = path.join(options.output.path, 'index.html');
  const contents = readFile(filepath);

  t.true(contents.includes('Super awesome package'));
});

test('Compiles all files as expected', async t => {
  const stats = await compileWebpack(options);
  const files = stats.toJson().assets.map(x => x.name);

  t.true(files.includes('products.html'));
  t.true(files.includes('products/first.html'));
  t.true(files.includes('products/second.html'));
  t.true(files.includes('products/third.html'));
  t.true(files.includes('products/third/colors.html'));
  t.true(files.includes('products/third/colors/green.html'));
  t.true(files.includes('products/third/colors/blue.html'));
  t.true(files.includes('index.html'));
  t.true(files.includes('about.html'));
  t.true(files.includes('404.html'));
});

test('Protected files were compiled with empty body', async t => {
  const publicContents = [
    '/products/first.html',
    '/products/second.html',
  ].map(x => readFile(options.output.path + x));

  publicContents.forEach(x => {
    t.false(x.includes('Redirecting you to <strong>/login</strong>...'));
    t.true(x.includes('This is a specific product'));
  });

  const privateContents = [
    '/products/third.html',
    '/products/third/colors.html',
    '/products/third/colors/green.html',
    '/products/third/colors/blue.html',
  ].map(x => readFile(options.output.path + x));

  // Assert that these contain the specified redirect text and do NOT contain
  // text rendered within react. I.e. they did not have their body rendered.
  privateContents.forEach(x => {
    t.true(x.includes('Redirecting you to <strong>/login</strong>...'));
    t.false(x.includes('A list of product colors'));
  });
});
