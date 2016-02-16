/* eslint-disable no-use-before-define, func-names */
import path from 'path';
import React from 'react';
import ReactDOM from 'react-dom/server';
import evaluate from 'eval';
import { match, RoutingContext } from 'react-router';
import async from 'async';

import { name as packageName } from '../package.json';
import { getAllPaths, log } from './utils.js';
import { render } from './Html.js';

/**
 * All source will be compiled with babel so ES6 goes
 *
 * Usage:
 *
 *   new StaticSitePlugin({ src: 'client/routes.js', ...options }),
 *
 */

function StaticSitePlugin(options) {
  this.options = options;
  this.render = this.options.template
    ? require(path.resolve(this.options.template))
    : render;
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
 * NOTE: Sometimes when matching routes we do not get an error but nore do we
 * get renderProps. In my experience this usually means we hit an IndexRedirect
 * or some form of Route that doesn't actually have a component to render. In
 * these cases we simply keep on moving and don't render anything.
 *
 * TODO:
 * - Allow passing a function for title?
 *
 */
StaticSitePlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', (compilation, cb) => {
    const asset = findAsset(this.options.src, compilation);

    if (!asset)
      throw new Error(`Output file not found: ${this.options.src}`);

    const source = evaluate(asset.source(), true);
    const Component = source.routes || source;
    log('src evaluated to Component:', Component);

    // NOTE: If Symbol(react.element) was removed this would no longer work
    if (!isValidComponent(Component)) {
      log('Component was invalid. Throwing error.');
      throw new Error(`${packageName} -- options.src entry point must export a valid React Component.`);
    }

    if (!isRoute(Component)) {
      log('Entrypoint or chunk name did not return a Route component. Rendering as individual component instead.');
      compilation.assets['index.html'] = renderSingleComponent(Component, this.options, this.render);
      return cb();
    }

    const paths = getAllPaths(Component);
    log('Parsed routes:', paths);

    async.forEach(paths,
      (location, callback) => {
        match({ routes: Component, location }, (err, redirectLocation, renderProps) => {
          // Skip if something goes wrong. See NOTE above.
          if (err || !renderProps) {
            log('Error matching route', err, renderProps);
            return callback();
          }

          const route = renderProps.routes[renderProps.routes.length - 1]; // See NOTE
          const body = ReactDOM.renderToString(<RoutingContext {...renderProps} />);
          const { stylesheet, favicon, bundle } = this.options;
          const assetKey = getAssetKey(location);
          const doc = this.render({
            title: route.title,
            body,
            stylesheet,
            favicon,
            bundle,
          });

          compilation.assets[assetKey] = {
            source() { return doc; },
            size() { return doc.length; },
          };

          callback();
        });
      },
      err => {
        if (err) throw err;
        cb();
      }
    );
  });
};

/**
 * @param {string} src
 * @param {Compilation} compilation
 */
const findAsset = (src, compilation) => {
  const asset = compilation.assets[src];

  // Found it. It was a key within assets
  if (asset) return asset;

  // Didn't find it in assets, it must be a chunk

  const webpackStatsJson = compilation.getStats().toJson();
  let chunkValue = webpackStatsJson.assetsByChunkName[src];

  // Uh oh, couldn't find it as a chunk value either. This indicates a failure
  // to find the asset. The caller should handle a falsey value as it sees fit.
  if (!chunkValue) return null;

  // Webpack outputs an array for each chunk when using sourcemaps
  if (chunkValue instanceof Array)
    chunkValue = chunkValue[0]; // Is the main bundle always the first element?

  return compilation.assets[chunkValue];
};

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
const getAssetKey = location => {
  const basename = path.basename(location);
  const dirname = path.dirname(location).slice(1); // See NOTE above
  let filename;

  if (!basename || location.slice(-1) === '/')
    filename = 'index.html';
  else if (basename === '*')
    filename = '404.html';
  else
    filename = basename + '.html';

  return dirname ? (dirname + path.sep + filename) : filename;
};

/**
 * Test if a React Element is a React Router Route or not. Note that this tests
 * the actual object (i.e. React Element), not a constructor. As such we
 * immediately deconstruct out the type property as that is what we want to
 * test.
 *
 * NOTE: Testing whether Component.type was an instanceof Route did not work.
 *
 * NOTE: This is a fragile test. The React Router API is notorious for
 * introducing breaking changes, so of the RR team changed the manditory path
 * and component props this would fail.
 */
const isRoute = ({ type: component }) =>
  component && component.propTypes.path && component.propTypes.component;

/**
 * Test if a component is a valid React component.
 *
 * NOTE: This is a pretty wonky test. React.createElement wasn't doing it for
 * me. It seemed to be giving false positives.
 *
 * @param {any} component
 * @return {boolean}
 */
const isValidComponent = Component => {
  const { type } = React.createElement(Component);
  return typeof type === 'object' || typeof type === 'function';
};

/**
 * If not provided with any React Router Routes we try to render whatever asset
 * was passed to the plugin as a React component. The use case would be anyone
 * who doesn't need/want to add RR as a dependency to their app and instead only
 * wants a single HTML file output.
 *
 * NOTE: In the case of a single component we use the static prop 'title' to get
 * the page title. If this is not provided then the title will default to
 * whatever is provided in the template.
 */
const renderSingleComponent = (Component, options, render) => { // eslint-disable-line no-shadow
  const body = ReactDOM.renderToString(<Component />);
  const { stylesheet, favicon, bundle } = options;
  const doc = render({
    title: Component.title, // See NOTE
    body,
    stylesheet,
    favicon,
    bundle,
  });

  return {
    source() { return doc; },
    size() { return doc.length; },
  };
};

module.exports = StaticSitePlugin;
