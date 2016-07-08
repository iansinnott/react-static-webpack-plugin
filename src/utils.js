/* @flow */
import isUndefined from 'lodash/isUndefined';
import flattenDeep from 'lodash/flattenDeep';
import React from 'react';
import ReactDOM from 'react-dom/server';
import path from 'path';

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
type RenderSingleComponent = (a: Object, b: OptionsShape, c: Renderer) => Asset;
export const renderSingleComponent: RenderSingleComponent = (imported, options, render) => {
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
};
