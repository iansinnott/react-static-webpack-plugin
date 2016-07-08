/* @flow */
import path from 'path';
import vm from 'vm';
import React from 'react';
import ReactDOM from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import async from 'async';
import Promise from 'bluebird';

import NodeTemplatePlugin from 'webpack/lib/node/NodeTemplatePlugin';
import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin';
import LibraryTemplatePlugin from 'webpack/lib/LibraryTemplatePlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';

import {
  getAllPaths,
  debug,
} from './utils.js';
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

/**
 * Mutative. Remove the routes file from the compilation. We don't actually want it
 * output into public
 * TODO: There is likely a better place to put this.
 *
 * [1] Is there any reason this logic could end up faulty? The creation of
 * a map file depends on the users config, so it may be better to check
 * for the existence of this file before removing.
 */
const removeExtraneousOutputFiles = (compilation) => {
  delete compilation.assets[outputFilename];
  delete compilation.assets[`${outputFilename}.map`]; // [1]
};

// TODO: Not very pure...
const outputFilename = 'routes.js';

type CompileAsset = (a: string, b: Object, c: string) => Promise;
const compileAsset: CompileAsset = (routes, compilation, context) => {
  const compilerName = `react-static-webpack compiling "${routes}"`;
  const outputOptions = {
    filename: outputFilename,
    publicPath: compilation.outputOptions.publicPath,
  };

  const childCompiler = compilation.createChildCompiler(compilerName, outputOptions);
  // childCompiler.apply(new NodeTemplatePlugin(outputOptions));
  // childCompiler.apply(new LibraryTemplatePlugin(null, 'commonjs2'));
  // childCompiler.apply(new NodeTargetPlugin());
  childCompiler.apply(new SingleEntryPlugin(context, routes));
  // childCompiler.apply(new LoaderTargetPlugin('node'));

  // TODO: Is this fragile? How does it compare to using the require.resolve as
  // shown here:
  // const ExtractTextPlugin__dirname = path.dirname(require.resolve('extract-text-webpack-plugin'));
  //
  // The whole reason to manually resolve the extract-text-wepbackplugin from
  // the context is that in my examples which are in subdirs of a large project
  // they were unable to correctly resolve the dirname, instead looking in the
  // top-level node_modules folder
  const ExtractTextPlugin__dirname = path.resolve(context, './node_modules/extract-text-webpack-plugin');

  // NOTE: This is taken directly from extract-text-webpack-plugin
  // https://github.com/webpack/extract-text-webpack-plugin/blob/v1.0.1/loader.js#L62
  childCompiler.plugin('this-compilation', function(compilation) {
    compilation.plugin('normal-module-loader', function(loaderContext) {
      loaderContext[ExtractTextPlugin__dirname] = false;
    });
  });

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
  let compilationPromise;

  // Compile Routes, template and redux store (if applicable)
  // TODO: Support compiling template
  // TODO: Support compiling reduxStore
  compiler.plugin('make', (compilation, cb) => {
    const { routes } = this.options;
    compilationPromise = compileAsset(routes, compilation, compiler.context)
    .catch(err => new Error(err))
    .finally(cb);
  });

  /**
   * [1]: We want to allow the user the option of eithe export default routes or
   * export routes.
   *
   * NOTE: It turns out that vm.runInThisContext works fine while evaluate
   * failes. It seems evaluate the routes file in this example as empty, which
   * it should not be... Not sure if switching to vm from evaluate will cause
   * breakage so i'm leaving it in here with this note for now.
   */
  compiler.plugin('emit', (compilation, cb) => {
    compilationPromise
    .then((asset) => {
      if (asset instanceof Error) {
        return Promise.reject(asset);
      }

      const source = asset.source();
      return vm.runInThisContext(source);
    })
    .catch(cb) // TODO: Eval failed, likely a syntax error in build
    .then((routes) => {
      if (!routes) {
        throw new Error(`File compiled with empty source: ${this.options.routes}`);
      }

      const Routes = routes.routes || routes; // [1]

      if (!isRoute(Routes)) {
        // TODO: This should be a debug log
        debug('Entrypoint or chunk name did not return a Route component. Rendering as individual component instead.');
        compilation.assets['index.html'] = renderSingleComponent(Routes, this.options, this.render);
        removeExtraneousOutputFiles(compilation);
        return cb();
      }

      const paths = getAllPaths(Routes);

      // TODO: This should be a debug log
      debug('Parsed routes:', paths);

      // Remove everything we don't want
      removeExtraneousOutputFiles(compilation);

      // TODO: Since we are using promises elsewhere it would make sense ot
      // promisify this async logic as well.
      async.forEach(paths,
        (location, callback) => {
          match({ routes: Routes, location }, (err, redirectLocation, renderProps) => {
            // Skip if something goes wrong. See NOTE above.
            if (err || !renderProps) {
              debug('Error matching route', err, renderProps);
              return callback();
            }

            const route = renderProps.routes[renderProps.routes.length - 1]; // See NOTE
            const body = ReactDOM.renderToString(<RouterContext {...renderProps} />);
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
    })
  });
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
 * If not provided with any React Router Routes we try to render whatever asset
 * was passed to the plugin as a React component. The use case would be anyone
 * who doesn't need/want to add RR as a dependency to their app and instead only
 * wants a single HTML file output.
 *
 * NOTE: In the case of a single component we use the static prop 'title' to get
 * the page title. If this is not provided then the title will default to
 * whatever is provided in the template.
 */
function renderSingleComponent(imported, options, render) { // eslint-disable-line no-shadow
  const Component = imported.default || imported;
  let body;

  try {
    body = ReactDOM.renderToString(<Component />);
  } catch (err) {
    throw new Error(`Invalid single component. Make sure you added your component as the default export from ${options.routes}`);
  }

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
