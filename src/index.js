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
  getExtraneousAssets,
  compileAsset,
  renderSingleComponent,
  getAssetKey,
  debug,
  prefix,
  addHash,
  log,
} from './utils.js';
import type {
  OptionsShape,
  MatchShape,
} from './constants.js';

const renderToStaticDocument = (Component, props) => {
  return '<!doctype html>' + renderToStaticMarkup(<Component {...props} />);
};

const validateOptions = (options) => {
  if (!options) {
    throw new Error('No options provided');
  }
  if (!options.routes && !options.component) {
    throw new Error('No component or routes param provided');
  }

  if (!options.template) {
    throw new Error('No template param provided');
  }
};

function StaticSitePlugin(options: OptionsShape) {
  validateOptions(options);
  this.options = options;
}

/**
 * The same as the RR match function, but promisified.
 */
const promiseMatch = (args) => new Promise((resolve, reject) => {
  match(args, (error, redirectLocation, renderProps) => {
    resolve({ error, redirectLocation, renderProps });
  }, reject);
});

/**
 * `compiler` is an instance of the Compiler
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


  /**
   * Compile everything that needs to be compiled. This is what the 'make'
   * plugin is excellent for.
   */
  compiler.plugin('make', (compilation, cb) => {
    const { component, routes, template, reduxStore } = this.options;

    // Compile routes and template
    const promises = [
      compileAsset({
        filepath: routes || component,
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
      .catch(err => Promise.reject(new Error(err)))
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
    .catch(cb) // TODO: Eval failed, likely a syntax error in build
    .then((assets) => {
      if (assets instanceof Error) {
        throw assets;
      }

      // Remove all the now extraneous compiled assets and any sourceamps that
      // may have been generated for them
      getExtraneousAssets().forEach(key => {
        debug(`Removing extraneous asset and associated sourcemap. Asset name: "${key}"`);
        delete compilation.assets[key];
        delete compilation.assets[key + '.map'];
      });

      let [routes, template, store] = assets;

      if (!routes) {
        throw new Error(`Entry file compiled with empty source: ${this.options.routes || this.options.component}`);
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

      // Support rendering a single component without the need for react router.
      if (!this.options.routes && this.options.component) {
        debug('Entrypoint specified with `component` option. Rendering individual component.');
        compilation.assets['index.html'] = renderSingleComponent(routes, addHash(this.options, compilation.hash), this.render, store);
        return cb();
      }

      const paths = getAllPaths(routes);
      debug('Parsed routes:', paths);

      // Make sure the user has installed redux dependencies if they passed in a
      // store
      let Provider;
      if (store) {
        try {
          Provider = require('react-redux').Provider;
        } catch (err) {
          err.message = `Looks like you provided the 'reduxStore' option but there was an error importing these dependencies. Did you forget to install 'redux' and 'react-redux'?\n${err.message}`;
          throw err;
        }
      }

      Promise.all(paths.map(location => {
        return promiseMatch({ routes, location })
        .then(({ error, redirectLocation, renderProps }: MatchShape): void => {
          let { options } = this;
          const logPrefix = 'react-static-webpack-plugin:';
          const emptyBodyWarning = 'Route will be rendered with an empty body.';
          let component;

          if (redirectLocation) {
            debug(`Redirect encountered. Ignoring route: "${location}"`, redirectLocation);
            log(`${logPrefix} Redirect encountered: ${location} -> ${redirectLocation.pathname}. ${emptyBodyWarning}`);
          } else if (error) {
            debug('Error encountered matching route', location, error, redirectLocation, renderProps);
            log(`${logPrefix} Error encountered rendering route "${location}". ${emptyBodyWarning}`);
          } else if (!renderProps) {
            debug('No renderProps found matching route', location, error, redirectLocation, renderProps);
            log(`${logPrefix} No renderProps found matching route "${location}". ${emptyBodyWarning}`);
          } else if (store) {
            debug(`Redux store provided. Rendering "${location}" within Provider.`);
            component = (
              <Provider store={store}>
                <RouterContext {...renderProps} />
              </Provider>
            );

            // Make sure initialState will be provided to the template
            options = { ...options, initialState: store.getState() };
          } else {
            component = <RouterContext {...renderProps} />; // Successful render
          }

          let title = '';

          if (renderProps) {
            const route = renderProps.routes[renderProps.routes.length - 1]; // See NOTE
            title = route.title;
          }

          const reactStaticCompilation = {
            error,
            redirectLocation,
            renderProps,
            location,
            options, // NOTE: Options is duplciated as a root level prop below, but removing that would mean a major version bump
          };

          const body = component ? renderToString(component) : '';
          const assetKey = getAssetKey(location);
          const doc = this.render({
            ...addHash(options, compilation.hash),
            title,
            body,
            reactStaticCompilation,
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
