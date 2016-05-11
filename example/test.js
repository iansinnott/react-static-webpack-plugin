import test from 'ava';
import webpack from 'webpack';

import options from './webpack.config.js';

test.cb('Compiles routes nested at one level', t => {
  webpack(options, function(err, stats) {
    if (err) {
      return t.end(err);
    } else if (stats.hasErrors()) {
      return t.end(stats.toString());
    }

    const files = stats.toJson().assets.map(x => x.name);

    t.true(files.indexOf('index.html') !== -1);
    t.true(files.indexOf('about.html') !== -1);
    t.true(files.indexOf('404.html') !== -1);

    t.end();
  });
});
