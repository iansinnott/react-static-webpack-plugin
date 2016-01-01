/* eslint-disable no-var, vars-on-top, space-before-function-paren, func-names, object-shorthand, no-use-before-define, no-unused-expressions */
var React = require('react');
var ReactDOM = require('react-dom/server');
var evaluate = require('eval');
var match = require('react-router').match;
var RoutingContext = require('react-router').RoutingContext;
var async = require('async');
var path = require('path');

var getAllPaths = require('../src/lib/getAllPaths.js').getAllPaths;

var renderDocumentToString = require('../src/Html.js').renderDocumentToString;

/**
 * We are running in this host system's node env. So all node goes but be aware
 * of the version number if using ES6. Of coures this module itself could be
 * compiled with babel.
 *
 * Usage:
 *
 * new StaticSitePlugin({ in: 'client/routes.js', out: 'public', ...options }),
 */

function StaticSitePlugin(options) {
  this.options = options;
}

/**
 * compiler seems to be an instance of the Compiler
 * https://github.com/webpack/webpack/blob/master/lib/Compiler.js#L143
 *
 * NOTE: renderProps.routes is always passed as an array of route elements. For
 * deeply nested routes the last element in the array is the route we want to
 * get the props of, so we grab it out of the array and use it. This lets us do
 * things like:
 *
 *   <Route title='Blah blah blah...' {...moreProps} />
 *
 * Then set the document title to the title defined on that route
 *
 * TODO:
 * - Allow defining a custom JSX template instead of the built-in Html.js
 * - Allow passing a function for title?
 *
 */
StaticSitePlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, cb) {
    var asset = findAsset(this.options.src, compilation);

    if (!asset)
      throw new Error('Output file not found: `' + this.options.src + '`');

    var routes = evaluate(asset.source()).routes;
    var paths = getAllPaths(routes);
    console.log(paths);

    async.forEach(
      paths,
      function forEachPath(location, callback) {
        match({ routes: routes, location: location }, function(error, redirectLocation, renderProps) {
          var route = renderProps.routes[renderProps.routes.length - 1]; // See NOTE
          var body = ReactDOM.renderToString(<RoutingContext {...renderProps} />);
          var doc = renderDocumentToString({
            title: route.title,
            body: body,
            stylesheet: this.options.stylesheet,
            favicon: this.options.favicon,
          });
          var assetKey = getAssetKey(location);

          compilation.assets[assetKey] = {
            source() { return doc; },
            size() { return doc.length; },
          };

          callback();
        }.bind(this));
      }.bind(this),
      function done(err) {
        if (err) throw err;
        cb();
      }
    );
  }.bind(this));
};

/**
 * @param {string} src
 * @param {Compilation} compilation
 */
function findAsset(src, compilation) {
  var asset = compilation.assets[src];

  // Found it. It was a key within assets
  if (asset) return asset;

  // Didn't find it in assets, it must be a chunk

  var webpackStatsJson = compilation.getStats().toJson();
  var chunkValue = webpackStatsJson.assetsByChunkName[src];

  // Uh oh, couldn't find it as a chunk value either. This indicates a failure
  // to find the asset. The caller should handle a falsey value as it sees fit.
  if (!chunkValue) return null;

  // Webpack outputs an array for each chunk when using sourcemaps
  if (chunkValue instanceof Array)
    chunkValue = chunkValue[0]; // Is the main bundle always the first element?

  return compilation.assets[chunkValue];
}

/**
 * Given a string location (i.e. path) return a relevant HTML filename.
 * Ex: '/' -> 'index.html'
 * Ex: '/about' -> 'about.html'
 * Ex: '/about/' -> 'about/index.html'
 * Ex: '/about/team' -> 'about/team.html'
 *
 * NOTE: Don't want leading slash
 * i.e. 'path/to/file.html' instead of '/path/to/file.html'
 *
 * NOTE: There is a lone case where the users specifices a not found route that
 * results in a '/*' location. In this case we output 404.html, since it's
 * assumed that this is a 404 route. See the RR changelong for details:
 * https://github.com/rackt/react-router/blob/1.0.x/CHANGES.md#notfound-route
 *
 * @param {string} location
 * @return {string} relative path to output file
 */
function getAssetKey(location) {
  var basename = path.basename(location);
  var dirname = path.dirname(location).slice(1); // See NOTE above
  var filename;

  if (!basename || location.slice(-1) === '/')
    filename = 'index.html';
  else if (basename === '*')
    filename = '404.html';
  else
    filename = basename + '.html';

  return dirname ? (dirname + path.sep + filename) : filename;
}

module.exports = StaticSitePlugin;
