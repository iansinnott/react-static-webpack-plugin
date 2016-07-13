import test from 'ava';
import webpack from 'webpack';

import options from './webpack.config.js';

test.cb('Compiles deeply nested routes', t => {
  webpack(options, function(err, stats) {
    if (err) {
      return t.end(err);
    } else if (stats.hasErrors()) {
      return t.end(stats.toString());
    }

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

    t.end();
  });
});
