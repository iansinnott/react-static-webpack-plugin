/* @flow */
import path from 'path';
import fs from 'fs';
import vm from 'vm';
import flattenDeep from 'lodash/flattenDeep';
import isString from 'lodash/isString';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Promise from 'bluebird';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';
import { jsdom, evalVMScript } from 'jsdom';

import type { OptionsShape } from './constants.js';

const debug = require('debug')('react-static-webpack-plugin:utils');

let extraneousAssets: string[] = [];

// Allow other files to get access to the extraneous assets
export const getExtraneousAssets = () => extraneousAssets;

/**
 * Adde a namespace/prefix to a filename so as to avoid naming conflicts with
 * things the user has created.
 */
export const prefix = (name: string): string => {
  return `__react-static-webpack-plugin__${name}`;
};

type CompileAssetOptionsShape = {
  filepath: string,
  outputFilename: string,
  compilation: Object,
  context: string,
};

/**
 * Get all candidate absolute paths for the extract text plugin. If there are
 * none that's fine. We use these paths to patch extract-text-wepback-plugin
 * during compilation so that it doesn't throw a fit about loader-plugin
 * interop.
 */
const getExtractTextPluginPaths = (compilation) => {
  const { options, context } = compilation.compiler;
  let paths = new Set(); // Ensure unique paths

  if (context) {
    paths.add(path.resolve(context, './node_modules/extract-text-webpack-plugin'));
  }

  if (options && options.context) {
    paths.add(path.resolve(options.context, './node_modules/extract-text-webpack-plugin'));
  }

  try {
    if (options.resolve.modules && options.resolve.modules.length) {
      options.resolve.modules.forEach(x => {
        paths.add(path.resolve(x, './extract-text-webpack-plugin'));
      });
    }
  } catch (err) { debug('Error resolving options.resolve.modules'); }

  try {
    if (options.resolveLoader.modules && options.resolveLoader.modules.length) {
      options.resolveLoader.modules.forEach(x => {
        paths.add(path.resolve(x, './extract-text-webpack-plugin'));
      });
    }
  } catch (err) { debug('Error resolving options.resolveLoader.modules'); }

  return Array.from(paths).filter(fs.existsSync);
};

/**
 * Given the filepath of an asset (say js file) compile it and return the source
 */
type CompileAsset = (a: CompileAssetOptionsShape) => Promise;
export const compileAsset: CompileAsset = (opts) => {
  const { filepath, outputFilename, compilation, context } = opts;
  const compilerName = `react-static-webpack compiling "${filepath}"`;
  const outputOptions = {
    filename: outputFilename,
    publicPath: compilation.outputOptions.publicPath,
  };
  let rawAssets = {};

  debug(`Compilation context "${context}"`);
  debug(`Compiling "${path.resolve(context, filepath)}"`);

  const childCompiler = compilation.createChildCompiler(compilerName, outputOptions);
  childCompiler.apply(new SingleEntryPlugin(context, filepath));

  // Patch extract text plugin
  childCompiler.plugin('this-compilation', (compilation) => {
    const extractTextPluginPaths = getExtractTextPluginPaths(compilation);
    debug('this-compilation patching extractTextPluginPaths %O', extractTextPluginPaths);

    // NOTE: This is taken directly from extract-text-webpack-plugin
    // https://github.com/webpack/extract-text-webpack-plugin/blob/v1.0.1/loader.js#L62
    //
    // It seems that returning true allows the use of css modules while
    // setting this equal to false makes the import of css modules fail, which
    // means rendered pages do not have the correct classnames.
    // loaderContext[x] = false;
    compilation.plugin('normal-module-loader', (loaderContext) => {
      extractTextPluginPaths.forEach(x => {
        loaderContext[x] = (content, opt) => { // See NOTE
          return true;
        };
      });
    });

    /**
     * In order to evaluate the raw compiled source files of assets instead of
     * the minified or otherwise optimized version we hook into here and hold on
     * to any chunk assets before they are compiled.
     *
     * NOTE: It is uncertain so far whether this source is actually the same as
     * the unoptimized source of the file in question. I.e. it may not be the
     * fullly compiled / bundled module code we want since this is not the emit
     * callback.
     */
    compilation.plugin('optimize-chunk-assets', (chunks, cb) => {
      const files: string[] = [];

      // Collect all asset names
      chunks.forEach((chunk) => {
        chunk.files.forEach((file) => files.push(file));
      });
      compilation.additionalChunkAssets.forEach((file) => files.push(file));

      rawAssets = files.reduce((agg, file) => {
        agg[file] = compilation.assets[file];
        return agg;
      }, {});

      // Update the extraneous assets to remove
      // TODO: This does not actually collect all the apropriate assets. What we
      // want is EVERY file that was compiled during this compilation, since we
      // don't want to output any of them. So far this only gets the associated
      // js files, like routes.js (with prefix)
      extraneousAssets = [ ...extraneousAssets, ...files ];

      cb();
    });
  });

  // Run the compilation async and return a promise
  // NOTE: For some reason, require simply doesn't work as expected in the
  // evaluated string src code. This was meant to be a temporary fix to fix the
  // issue of requiring node-uuid. It would be better to find a way to fully
  // support any module code. Specifically, code like this failse because the
  // require function simply does not return the built in crypto module:
  // https://github.com/crypto-browserify/crypto-browserify/blob/v3.2.6/rng.js
  return new Promise((resolve, reject) => {
    childCompiler.runAsChild(function(err, entries, childCompilation) {
      // Resolve / reject the promise
      if (childCompilation.errors && childCompilation.errors.length) {
        const errorDetails = childCompilation.errors.map((err) => {
          return err.message + (err.error ? ':\n' + err.error : '');
        }).join('\n');

        reject(new Error('Child compilation failed:\n' + errorDetails));
      } else {
        let asset = compilation.assets[outputFilename];

        // See 'optimize-chunk-assets' above
        if (rawAssets[outputFilename]) {
          debug(`Using raw source for ${filepath}`);
          asset = rawAssets[outputFilename];
        }

        resolve(asset);
      }
    });
  })
  .then((asset) => {
    if (asset instanceof Error) {
      debug(`${filepath} failed to copmile. Rejecting...`);
      return Promise.reject(asset);
    }

    debug(`${filepath} compiled. Processing source...`);

    // Instantiate browser sandbox
    const doc = jsdom('<html><body></body></html>');
    const win = doc.defaultView;

    // Pre-compile asset source
    const script = new vm.Script(asset.source(), {
      filename: filepath,
      displayErrors: true
    });

    // Run it in the JSDOM context
    return evalVMScript(win, script);
  })
  .catch((err) => {
    debug(`${filepath} failed to process. Rejecting...`);
    return Promise.reject(err);
  });
};

// can be an React Element or a POJO
type RouteShape = {
  component?: any,
  props?: Object,
  childRoutes?: Object[],
  path?: string,
};

/**
 * NOTE: We could likely use createRoutes to our advantage here. It may simplify
 * the code we currently use to recurse over the virtual dom tree:
 *
 * import { createRoutes } from 'react-router';
 * console.log(createRoutes(routes)); =>
 * [ { path: '/',
 *    component: [Function: Layout],
 *    childRoutes: [ [Object], [Object] ] } ]
 *
 * Ex:
 * const routes = (
 *   <Route component={App} path='/'>
 *     <Route component={About} path='/about' />
 *   </Route>
 * );
 *
 * getAllPaths(routes); => ['/', '/about]
 */
type GetNestedPaths = (a?: RouteShape | RouteShape[], b?: string) => any[];
export const getNestedPaths: GetNestedPaths = (route, prefix = '') => {
  if (!route) return [];

  if (Array.isArray(route)) return route.map(x => getNestedPaths(x, prefix));

  let path = route.props && route.props.path || route.path;
  // Some routes such as redirects or index routes do not have a path. Skip
  // them.
  if (!path) return [];

  path = prefix + path;
  const nextPrefix = path === '/' ? path : path + '/';
  const childRoutes = route.props && route.props.children || route.childRoutes;
  return [path, ...getNestedPaths(childRoutes, nextPrefix)];
};

export const getAllPaths = (routes: RouteShape | RouteShape[]): string[] => {
  return flattenDeep(getNestedPaths(routes));
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
export const getAssetKey = (location: string): string => {
  const basename = path.basename(location);
  const dirname = path.dirname(location).slice(1); // See NOTE above
  let filename;

  if (location.slice(-1) === '/') {
    filename = !basename ? 'index.html' : basename + '/index.html';
  } else if (basename === '*') {
    filename = '404.html';
  } else {
    filename = basename + '.html';
  }

  const result = dirname ? (dirname + path.sep + filename) : filename;

  debug(`Getting asset key: "${location}" -> "${result}"`);

  return result;
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
type IsRoute = (a: { type: Object }) => boolean;
export const isRoute: IsRoute = ({ type: component }) => {
  return component && component.propTypes.path && component.propTypes.component;
};

type Asset = {
  source(): string,
  size(): number,
};

type Renderer = (a: OptionsShape) => string;

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
type RenderSingleComponent = (a: Object, b: OptionsShape, c: Renderer, d: ?Object) => Asset;
export const renderSingleComponent: RenderSingleComponent = (imported, options, render, store) => {
  const Component = imported.default || imported;
  let body;

  let component = <Component />;

  // Wrap the component in a Provider if the user passed us a redux store
  if (store) {
    debug('Store provider. Rendering single component within Provider.');
    try {
      const { Provider } = require('react-redux');
      component = (
        <Provider store={store}>
          <Component />
        </Provider>
      );

      // Make sure initialState will be provided to the template. Don't mutate
      // options directly
      options = { ...options, initialState: store.getState() }; // eslint-disable-line no-param-reassign
    } catch (err) {
      err.message = `Could not require react-redux. Did you forget to install it?\n${err.message}`;
      throw err;
    }
  }

  try {
    debug('Rendering single component.');
    body = renderToString(component);
  } catch (err) {
    throw new Error(`Invalid single component. Make sure you added your component as the default export from ${options.routes}`);
  }

  const doc = render({
    ...options,
    title: Component.title, // See NOTE
    body,
  });

  return {
    source() { return doc; },
    size() { return doc.length; },
  };
};

/**
 * Only log in prod and dev. I.e. do not log on CI. The reason for logging
 * during prod is that we usually only build our bundles with
 * NODE_ENV=production prefixing the build command.
 */
export const log = (...args: Array<string>): void => {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
    console.log(...args);
  }
};

/**
 * Add hash to all options that includes '[hash]' ex: bundle.[hash].js
 * NOTE: Only one hash for all files. So even if the css did not change it will get a new hash if the js changed.
 *
 * @param {Options} options
 * @param {string}  hash
 */

type AddHash = (a: Object, b: string) => Object;
export const addHash: AddHash = (options, hash) => {
  return Object.keys(options).reduce((previous, current) => {
    if (!isString(options[current])) {
      previous[current] = options[current];
      return previous;
    }

    previous[current] = (options[current] && hash ? options[current].replace('[hash]', hash) : options[current]);
    return previous;
  }, {});
};
