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

    t.deepEqual(files, [
      'app.js',
      'app.js.map',
      'index.html',
      'about.html',
      '404.html',
    ]);

    t.end();
  });
});
