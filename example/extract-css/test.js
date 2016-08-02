import test from 'ava';
import webpack from 'webpack';

import options from './webpack.config.prod.js';

test.cb('Compiles files that import CSS', t => {
  webpack(options, (err, stats) => {
    if (err) {
      return t.end(err);
    } else if (stats.hasErrors()) {
      return t.end(stats.toString());
    }

    const files = stats.toJson().assets.map(x => x.name);

    t.true(files.includes('index.html'));
    t.true(files.includes('app.css'));

    t.end();
  });
});
