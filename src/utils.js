import isArray from 'lodash/isArray';
import isUndefined from 'lodash/isUndefined';
import flattenDeep from 'lodash/flattenDeep';
import debug from 'debug';

import { name as packageName } from '../package.json';

/**
 * A simple debug logger
 */
export const log = debug(packageName);

/**
 * This is not a very sophisticated checking method. Assuming we already know
 * this is either a Route or an IndexRoute under what cases would this break?
 */
const hasNoComponent = route => {
  return isUndefined(route.props.path) || isUndefined(route.props.component);
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
export const getNestedPaths = (route, prefix = '') => {
  if (!route) return [];

  if (isArray(route)) return route.map(x => getNestedPaths(x, prefix));

  // Some routes such as redirects or index routes do not have a component. Skip
  // them.
  if (hasNoComponent(route)) return [];

  const path = prefix + route.props.path;
  const nextPrefix = path === '/' ? path : path + '/';
  return ([path].concat(getNestedPaths(route.props.children, nextPrefix)));
};

export const getAllPaths = routes => {
  return flattenDeep(getNestedPaths(routes));
};

export default getAllPaths;
