/**
 * NOTE: Since this is webpack 2 and we don't transpile imports i needed to
 * remove any import syntax from even this test file.
 */
const test = require('ava');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

const config = require('./webpack.config.prod.js');

let stats;

test.cb.before(t => {
  webpack(config).run((err, _stats) => {
    if (err) {
      return t.end(err);
    } else if (_stats.hasErrors()) {
      return t.end(_stats.toString());
    }

    stats = _stats;

    t.end();
  });
});

test('Outputs the desired files', t => {
  const { assets } = stats.toJson();
  const files = assets.map(x => x.name);

  t.true(files.includes('index.html'));
  t.true(files.includes('about.html'));
  t.true(files.includes('404.html'));
  t.true(files.includes('app.css'));
  t.true(files.includes('app.js'));
});

test('Compiles local CSS classes (CSS Modules)', t => {
  const outputFilepath = path.join(config.output.path, 'index.html');
  const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });

  // Simply make sure this classname isn't found
  t.false(outputFileContents.includes('testableModuleClassName'));
});

test('Supports minification', t => {
  const { assets } = stats.toJson();
  const files = assets.map(x => x.name);
  const bundle = assets[files.indexOf('app.js')];

  // Test size in MB. We want to make sure this bundle was minified since we
  // are using the minify JS plugin
  t.true((bundle.size / 1000) < 300);
});
