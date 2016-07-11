/* @flow */
import isUndefined from 'lodash/isUndefined';
import flattenDeep from 'lodash/flattenDeep';
import React from 'react';
import { renderToString } from 'react-dom/server';
import path from 'path';
import Promise from 'bluebird';
import vm from 'vm';

import NodeTemplatePlugin from 'webpack/lib/node/NodeTemplatePlugin';
import NodeTargetPlugin from 'webpack/lib/node/NodeTargetPlugin';
import LoaderTargetPlugin from 'webpack/lib/LoaderTargetPlugin';
import LibraryTemplatePlugin from 'webpack/lib/LibraryTemplatePlugin';
import SingleEntryPlugin from 'webpack/lib/SingleEntryPlugin';


import type { OptionsShape } from './constants.js';

/**
 * A simple debug logger
 */
export const debug = require('debug')('react-static-webpack-plugin');

/**
 * This is not a very sophisticated checking method. Assuming we already know
 * this is either a Route or an IndexRoute under what cases would this break?
 */
const hasNoComponent = route => {
  return isUndefined(route.props.path) || isUndefined(route.props.component);
};

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
 * Given the filepath of an asset (say js file) compile it and return the source
 *
 * [1]: For now i'm assuming that if there is an _originalSource key then the
 * user is using uglifyjs. However, this may be a fragile check and could
 * benefit from refactoring. The optimal solution would likely be to simply
 * remove the uglify plugin from the child compiler. However this solution
 * doesn't feel generic.
 *
 */
type CompileAsset = (a: CompileAssetOptionsShape) => Promise;
export const compileAsset: CompileAsset = (opts) => {
  const { filepath, outputFilename, compilation, context } = opts;
  const compilerName = `react-static-webpack compiling "${filepath}"`;
  const outputOptions = {
    filename: outputFilename,
    publicPath: compilation.outputOptions.publicPath,
  };

  debug(`Compiling "${filepath}"`);

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
      // TODO: Make note about this. It seems that returning true allows the use
      // of css modules while setting this equal to false makes the import of
      // css modules fail, which means rendered pages do not have the correct
      // classnames.
      // loaderContext[extractTextPluginPath] = false;
      loaderContext[extractTextPluginPath] = (content, opt) => {
        return true;
      };
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

        reject(new Error('Child compilation failed:\n' + errorDetails));
      } else {
        resolve(compilation.assets[outputFilename]);
      }
    });
  })
  .then((asset) => {
    if (asset instanceof Error) {
      debug(`${filepath} failed to copmile. Rejecting...`);
      return Promise.reject(asset);
    }

    debug(`${filepath} compiled. Processing source...`);

    if (asset._originalSource) {
      debug('Source appears to be minified with UglifyJsPlugin. Using asset._originalSource for child compilation instead');
    }

    const source = asset._originalSource || asset.source(); // [1]
    return vm.runInThisContext(source);
  })
  .catch((err) => {
    debug(`${filepath} failed to copmile. Rejecting...`);
    return Promise.reject(err);
  });
};

type RouteShape = {
  component: any,
  props: Object,
  childRoutes?: Object[],
  path?: string,
}

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
type GetNestedPaths = (a: RouteShape | RouteShape[], b: ?string) => any[];
export const getNestedPaths: GetNestedPaths = (route, prefix = '') => {
  if (!route) return [];

  if (Array.isArray(route)) return route.map(x => getNestedPaths(x, prefix));

  // Some routes such as redirects or index routes do not have a component. Skip
  // them.
  if (hasNoComponent(route)) return [];

  const path = prefix + route.props.path;
  const nextPrefix = path === '/' ? path : path + '/';
  return [path, ...getNestedPaths(route.props.children, nextPrefix)];
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

  if (!basename || location.slice(-1) === '/') {
    filename = 'index.html';
  } else if (basename === '*') {
    filename = '404.html';
  } else {
    filename = basename + '.html';
  }

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
    debug('Store provider. Rendering single component with provider');
    try {
      const { Provider } = require('react-redux');
      component = (
        <Provider store={store}>
          <Component />
        </Provider>
      );
    } catch (err) {
      err.message = `Could not require react-redux. Did you forget to install it?\n${err.message}`;
      throw err;
    }
  }

  try {
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
