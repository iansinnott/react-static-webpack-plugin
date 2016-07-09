import test from 'ava';
import webpack from 'webpack';

import options from './webpack.config.prod.js';

test.cb('Compiles files that import CSS', t => {
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

    const bundle = assets[files.indexOf('app.js')];

    // Test size in MB. We want to make sure this bundle was minified since we
    // are using the minify JS plugin
    t.true((bundle.size / 1000) < 300);

    t.end();
  });
});
