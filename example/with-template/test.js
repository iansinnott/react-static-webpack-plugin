import test from 'ava';
import webpack from 'webpack';
import path from 'path';
import fs from 'fs';

import options from './webpack.config.js';

test.cb('Supports custom JSX template files', t => {
  webpack(options, function(err, stats) {
    if (err) {
      return t.end(err);
    } else if (stats.hasErrors()) {
      return t.end(stats.toString());
    }

    const outputFilepath = path.join(options.output.path, 'index.html');
    const outputFileContents = fs.readFileSync(outputFilepath, { encoding: 'utf8' });
    t.true(outputFileContents.includes('Super awesome package'));

    t.end();
  });
});
