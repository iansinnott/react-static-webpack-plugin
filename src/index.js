/* @flow */
import path from 'path';
import vm from 'vm';
import React from 'react';
import ReactDOM from 'react-dom/server';
import evaluate from 'eval';
import { match, RouterContext } from 'react-router';
import async from 'async';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import Promise from 'bluebird';

/**
 * TODO: There is currnetly an issue where it seems the compiled bundle is not
 * UMD. Meaning when it getes evaled there is nothing there so the component is
 * not recognized.
 *
 * Maybe try using the library target plugin...
 */

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

type Options = {
  routes: string,
  bundle?: string,
  stylesheet?: string,
  favicon?: string,
  template?: string,

  src?: string, // Deprecated. Use routes instead
}

const validateOptions = (options) => {
  if (!options.routes) {
    throw new Error('No routes param provided');
  }
};

// Purely for debugging
const dir = (obj, params) => console.dir(obj, { colors: true, depth: 4, ...params });

const CompileAsset = (a: string, b: Object, c: string) => Promise;
const compileRoutes: CompileAsset = (routes, compilation, context) => {

  const compilerName = `react-static-webpack compiling "${routes}"`;
  const outputFilename = 'routes.js';
  const outputOptions = {
    filename: outputFilename,
    publicPath: compilation.outputOptions.publicPath,
  };

  const childCompiler = compilation.createChildCompiler(compilerName, outputOptions);
  childCompiler.apply(
    new SingleEntryPlugin(context, routes)
  );

  // Run the compilation async and return a promise
  return new Promise((resolve, reject) => {
    childCompiler.runAsChild(function(err, entries, childCompilation) {
      // Resolve / reject the promise
      if (childCompilation.errors && childCompilation.errors.length) {
        const errorDetails = childCompilation.errors.map((err) => {
          return err.message + (err.error ? ':\n' + err.error : '');
        }).join('\n');

        reject('Child compilation failed:\n' + errorDetails);
      } else {
        resolve(compilation.assets[outputFilename]);
      }
    });
  });
};

function StaticSitePlugin(options: Options) {
  validateOptions(options);
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

  // compiler.plugin('compilation', (compilation) => {
  //   if (compilation.compiler.isChild()) return;
  //   console.log('Compilation');
  // });

  // compiler.plugin("normal-module-factory", function(nmf) {
  //   console.log('NMF', nmf);
  //     nmf.plugin("after-resolve", function(data) {
  //       console.log('DATA', data);
  //         data.loaders.unshift(path.join(__dirname, "postloader.js"));
  //     });
  // });

  // Can add loaders here as well since we have access to
  // params.normalModuleFactory
  // compiler.plugin('compile', (params) => {
  //   console.log('PARAMS');
  //   dir(params);
  // });

  let compilationPromise;

  // Compile Routes and or entry point
  compiler.plugin('make', (compilation, cb) => {
    const { routes } = this.options;
    compilationPromise = compileRoutes(routes, compilation, this.context)
    .catch(err => new Error(err))
    .finally(cb);
  });

  /**
   * [1]: We want to allow the user the option of eithe export default routes or
   * export routes.
   */
  compiler.plugin('emit', (compilation, cb) => {
    compilationPromise
    .then((asset) => {
      return vm.runInThisContext(source);
      // console.log(evaluate(asset.source(), true));
      // return evaluate(asset.source(), true);
    })
    .catch(cb) // TODO: Eval failed, likely a syntax error in build
    .then((routes) => {
      if (!routes) {
        throw new Error(`File compiled with empty source: ${this.options.routes}`);
      }

      const Component = routes.routes || routes; // [1]

      dir(Component);

      if (!isRoute(Component)) {
        log('Entrypoint or chunk name did not return a Route component. Rendering as individual component instead.');
        compilation.assets['index.html'] = renderSingleComponent(Component, this.options, this.render);
        return cb();
      }

      const paths = getAllPaths(Component);
      log('Parsed routes:', paths);

      cb();
    })
    // .then(() => {
    //   const asset = findAsset(this.options.src, compilation);
    //
    //   if (!asset) {
    //     throw new Error(`Output file not found: ${this.options.src}`);
    //   }
    //
    //   const source = evaluate(asset.source(), true);
    //   const Component = source.routes || source;
    //   log('src evaluated to Component:', Component);
    //
    //   // NOTE: If Symbol(react.element) was removed this would no longer work
    //   if (!isValidComponent(Component)) {
    //     log('Component was invalid. Throwing error.');
    //     throw new Error(`${packageName} -- options.src entry point must export a valid React Component.`);
    //   }
    //
    //   if (!isRoute(Component)) {
    //     log('Entrypoint or chunk name did not return a Route component. Rendering as individual component instead.');
    //     compilation.assets['index.html'] = renderSingleComponent(Component, this.options, this.render);
    //     return cb();
    //   }
    //
    //   const paths = getAllPaths(Component);
    //   log('Parsed routes:', paths);
    //
    //   async.forEach(paths,
    //     (location, callback) => {
    //       match({ routes: Component, location }, (err, redirectLocation, renderProps) => {
    //         // Skip if something goes wrong. See NOTE above.
    //         if (err || !renderProps) {
    //           log('Error matching route', err, renderProps);
    //           return callback();
    //         }
    //
    //         const route = renderProps.routes[renderProps.routes.length - 1]; // See NOTE
    //         const body = ReactDOM.renderToString(<RouterContext {...renderProps} />);
    //         const { stylesheet, favicon, bundle } = this.options;
    //         const assetKey = getAssetKey(location);
    //         const doc = this.render({
    //           title: route.title,
    //           body,
    //           stylesheet,
    //           favicon,
    //           bundle,
    //         });
    //
    //         compilation.assets[assetKey] = {
    //           source() { return doc; },
    //           size() { return doc.length; },
    //         };
    //
    //         callback();
    //       });
    //     },
    //     err => {
    //       if (err) throw err;
    //       cb();
    //     }
    //   );
    // })

  });
};

/**
 * @param {string} src
 * @param {Compilation} compilation
 */
function findAsset(src, compilation) {
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
  if (chunkValue instanceof Array) {
    chunkValue = chunkValue[0]; // Is the main bundle always the first element?
  }

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
 */
function getAssetKey(location: string): string {
  const basename = path.basename(location);
  const dirname = path.dirname(location).slice(1); // See NOTE above
  let filename;

  if (!basename || location.slice(-1) === '/') {
    filename = 'index.html';
  } else if (basename === '*') {
    filename = '404.html';
  } else {
    filename = basename + '.html';
  }

  return dirname ? (dirname + path.sep + filename) : filename;
}

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
function isRoute({ type: component }): boolean {
  return component && component.propTypes.path && component.propTypes.component;
}

/**
 * Test if a component is a valid React component.
 *
 * NOTE: This is a pretty wonky test. React.createElement wasn't doing it for
 * me. It seemed to be giving false positives.
 *
 * @param {any} component
 * @return {boolean}
 */
function isValidComponent(Component): boolean {
  const { type } = React.createElement(Component);
  return typeof type === 'object' || typeof type === 'function';
}

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
function renderSingleComponent(Component, options, render) { // eslint-disable-line no-shadow
  dir(Component)
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
}

module.exports = StaticSitePlugin;
