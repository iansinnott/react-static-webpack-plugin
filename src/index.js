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
  isRoute,
  renderSingleComponent,
  getAssetKey,
  debug,
} from './utils.js';
import { render } from './Html.js';
import type {
  OptionsShape,
} from './constants.js';

/**
 * All source will be compiled with babel so ES6 goes
 *
 * Usage:
 *
 *   new StaticSitePlugin({ src: 'client/routes.js', ...options }),
 *
 */

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
const removeExtraneousOutputFiles = (compilation, outputFilename) => {
  delete compilation.assets[outputFilename];
  delete compilation.assets[`${outputFilename}.map`]; // [1]
};

type CompileAssetOptionsShape = {
  filepath: string,
  outputFilename: string,
  compilation: Object,
  context: string,
};

type CompileAsset = (a: CompileAssetOptionsShape) => Promise;
const compileAsset: CompileAsset = (opts) => {
  const { filepath, outputFilename, compilation, context } = opts;
  const compilerName = `react-static-webpack compiling "${filepath}"`;
  const outputOptions = {
    filename: outputFilename,
    publicPath: compilation.outputOptions.publicPath,
  };

  const childCompiler = compilation.createChildCompiler(compilerName, outputOptions);
  // childCompiler.apply(new NodeTemplatePlugin(outputOptions));
  // childCompiler.apply(new NodeTargetPlugin());
  childCompiler.apply(new SingleEntryPlugin(context, filepath));
  // childCompiler.apply(new LoaderTargetPlugin('node'));

  // console.dir(childCompiler._plugins, {colors: true})

  // TODO: Is this fragile? How does it compare to using the require.resolve as
  // shown here:
  // const ExtractTextPlugin__dirname = path.dirname(require.resolve('extract-text-webpack-plugin'));
  //
  // The whole reason to manually resolve the extract-text-wepbackplugin from
  // the context is that in my examples which are in subdirs of a large project
  // they were unable to correctly resolve the dirname, instead looking in the
  // top-level node_modules folder
  const extractTextPluginPath = path.resolve(context, './node_modules/extract-text-webpack-plugin');

  // NOTE: This is taken directly from extract-text-webpack-plugin
  // https://github.com/webpack/extract-text-webpack-plugin/blob/v1.0.1/loader.js#L62
  childCompiler.plugin('this-compilation', (compilation) => {
    compilation.plugin('normal-module-loader', (loaderContext) => {
      loaderContext[extractTextPluginPath] = false;
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

function StaticSitePlugin(options: OptionsShape) {
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
    compilationPromise = compileAsset({
      filepath: routes,
      outputFilename: 'routes.js',
      compilation,
      context: compiler.context,
    })
    .catch(err => new Error(err))
    .finally(cb);
  });

  /**
   * [1]: For now i'm assuming that if there is an _originalSource key then the
   * user is using uglifyjs. However, this may be a fragile check and could
   * benefit from refactoring. The optimal solution would likely be to simply
   * remove the uglify plugin from the child compiler. However this solution
   * doesn't feel generic.
   *
   * [2]: We want to allow the user the option of either export default routes or
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

      if (asset._originalSource) {
        debug('Source appears to be minified with UglifyJsPlugin. Using asset._originalSource for child compilation instead');
      }

      const source = asset._originalSource || asset.source(); // [1]
      return vm.runInThisContext(source);
    })
    .catch(cb) // TODO: Eval failed, likely a syntax error in build
    .then((routes) => {
      if (!routes) {
        throw new Error(`File compiled with empty source: ${this.options.routes}`);
      }

      const Routes = routes.routes || routes; // [2]

      if (!isRoute(Routes)) {
        debug('Entrypoint or chunk name did not return a Route component. Rendering as individual component instead.');
        compilation.assets['index.html'] = renderSingleComponent(Routes, this.options, this.render);
        removeExtraneousOutputFiles(compilation, 'routes.js');
        return cb();
      }

      const paths = getAllPaths(Routes);

      // TODO: This should be a debug log
      debug('Parsed routes:', paths);

      // Remove everything we don't want
      removeExtraneousOutputFiles(compilation, 'routes.js');

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
    });
  });
};

module.exports = StaticSitePlugin;
