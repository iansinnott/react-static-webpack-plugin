/**
 * @flow
 *
 * Webpack Plugin Resources:
 * - https://github.com/andreypopp/webpack-stylegen/blob/master/lib/webpack/index.js#L5
 * - https://github.com/webpack/extract-text-webpack-plugin/blob/v1.0.1/loader.js#L62
 * - https://github.com/kevlened/debug-webpack-plugin/blob/master/index.js
 * - https://github.com/ampedandwired/html-webpack-plugin/blob/v2.0.3/index.js
 */
import React from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import Promise from 'bluebird';
import isFunction from 'lodash/isFunction';

import {
  getAllPaths,
  compileAsset,
  isRoute,
  renderSingleComponent,
  getAssetKey,
  debug,
  prefix,
} from './utils.js';
import { Html } from './Html.js';
import type {
  OptionsShape,
} from './constants.js';

const renderToStaticDocument = (Component, props) => {
  return '<!doctype html>' + renderToStaticMarkup(<Component {...props} />);
};

const validateOptions = (options) => {
  if (!options.routes) {
    throw new Error('No routes param provided');
  }

  if (!options.template) {
    throw new Error('No template param provided');
  }
};

function StaticSitePlugin(options: OptionsShape) {
  validateOptions(options);
  this.options = options;
  this.render = (props) => renderToStaticDocument(Html, props);
}

/**
 * The same as the RR match function, but promisified.
 */
const promiseMatch = (args) => new Promise((resolve, reject) => {
  match(args, (err, redirectLocation, renderProps) => {
    resolve({ err, redirectLocation, renderProps });
  }, reject);
});

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
  const extraneousAssets = ['routes.js', 'template.js'];
  let compilationPromise;


  /**
   * Compile everything that needs to be compiled. This is what the 'make'
   * plugin is excellent for.
   *
   * TODO: Support compiling template
   * TODO: Support compiling reduxStore
   *
   * We likely need to do a Promise.all sort of thing to compile every asset we
   * need and act accordingly.
   */
  compiler.plugin('make', (compilation, cb) => {
    const { routes, template, reduxStore } = this.options;

    // Compile routes and template
    const promises = [
      compileAsset({
        filepath: routes,
        outputFilename: prefix('routes.js'),
        compilation,
        context: compiler.context,
      }),
      compileAsset({
        filepath: template,
        outputFilename: prefix('template.js'),
        compilation,
        context: compiler.context,
      }),
    ];

    if (reduxStore) {
      promises.push(
        compileAsset({
          filepath: reduxStore,
          outputFilename: prefix('store.js'),
          compilation,
          context: compiler.context,
        })
      );
    }

    compilationPromise = Promise.all(promises)
    .catch(err => new Error(err))
    .finally(cb);
  });

  /**
   * NOTE: It turns out that vm.runInThisContext works fine while evaluate
   * failes. It seems evaluate the routes file in this example as empty, which
   * it should not be... Not sure if switching to vm from evaluate will cause
   * breakage so i'm leaving it in here with this note for now.
   *
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
   * - Allow passing a function for title
   */
  compiler.plugin('emit', (compilation, cb) => {
    compilationPromise
    .catch((err) => {
      debug('dafuq');
      cb(err);
    }) // TODO: Eval failed, likely a syntax error in build
    .then((assets) => {
      if (assets instanceof Error) {
        throw assets;
      }

      let [ routes, template, store ] = assets;

      if (!routes) {
        throw new Error(`Routes file compiled with empty source: ${this.options.routes}`);
      }

      routes = routes.routes || routes.default || routes;

      if (template) {
        template = template.default || template;
      }

      if (store) {
        store = store.store || store.default || store;
      }

      if (this.options.template && !isFunction(template)) {
        throw new Error(`Template file did not compile with renderable default export: ${this.options.template}`);
      }

      // Set up the render function that will be used later on
      this.render = (props) => renderToStaticDocument(template, props);

      if (!isRoute(routes)) {
        debug('Entrypoint or chunk name did not return a Route component. Rendering as individual component instead.');
        compilation.assets['index.html'] = renderSingleComponent(routes, this.options, this.render, store);
        return cb();
      }

      const paths = getAllPaths(routes);
      debug('Parsed routes:', paths);

      let Provider;
      try {
        Provider = require('react-redux').Provider;
      } catch (err) {
        err.message = `Looks like you provided the 'reduxStore' option but there was an error importing these dependencies. Did you forget to install 'redux' and 'react-redux'?\n${err.message}`;
        throw err;
      }

      // TODO: Remove everything we don't want

      Promise.all(paths.map(location => {
        return promiseMatch({ routes, location })
        .then(({ err, redirectLocation, renderProps }) => {
          if (err || !renderProps) {
            debug('Error matching route', location, err, renderProps);
            return Promise.reject(new Error(`Error matching route: ${location}`));
          }

          let component = <RouterContext {...renderProps} />;

          if (store) {
            debug(`Redux store provided. Rendering "${location}" within Provider.`);
            component = (
              <Provider store={store}>
                <RouterContext {...renderProps} />
              </Provider>
            );
          }

          const route = renderProps.routes[renderProps.routes.length - 1]; // See NOTE
          const body = renderToString(component); // TOOD: This is where we would want to add a redux wrapper...
          const assetKey = getAssetKey(location);
          const doc = this.render({
            ...this.options,
            title: route.title,
            body,
          });

          compilation.assets[assetKey] = {
            source() { return doc; },
            size() { return doc.length; },
          };
        });
      }))
      .catch((err) => {
        if (err) throw err;
      })
      .finally(cb);
    });
  });
};

module.exports = StaticSitePlugin;
