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

    t.true(files.includes('index.html'));
    t.true(files.includes('about.html'));
    t.true(files.includes('404.html'));

    t.end();
  });
});
