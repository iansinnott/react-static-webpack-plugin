import test from 'ava';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';

import options from './webpack.config.prod.js';

test.cb('Supports minification as well as CSS modules', t => {
  webpack(options, function(err, stats) {
    if (err) {
      return t.end(err);
    } else if (stats.hasErrors()) {
      return t.end(stats.toString());
    }

    const { assets } = stats.toJson();
    const files = assets.map(x => x.name);

    t.true(files.includes('index.html'));
    t.true(files.includes('about.html'));
    t.true(files.includes('404.html'));
    t.true(files.includes('app.css'));
    t.true(files.includes('app.js'));

    // Test CSS module compilation. Plain text classname should not be present
    const outputFilepath = path.join(options.output.path, 'index.html');
    const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });
    t.false(outputFileContents.includes('testableModuleClassName'));

    // Test size in MB. We want to make sure this bundle was minified since we
    // are using the minify JS plugin
    const bundle = assets[files.indexOf('app.js')];
    t.true((bundle.size / 1000) < 300);

    t.end();
  });
});
