import { IndexRoute } from 'react-router';
import { isArray } from 'lodash/lang';
import { flattenDeep } from 'lodash/array';

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

  // Index routes don't represent a distinct path, so we don't count them
  if (route.type === IndexRoute) return [];

  const path = prefix + route.props.path;
  const nextPrefix = path === '/' ? path : path + '/';
  return ([path].concat(getNestedPaths(route.props.children, nextPrefix)));
};

export const getAllPaths = routes => {
  return flattenDeep(getNestedPaths(routes));
};

export default getAllPaths;
