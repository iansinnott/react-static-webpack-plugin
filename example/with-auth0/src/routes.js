import React from 'react';
import { Route, IndexRoute } from 'react-router';

import { App, Home, About, NotFound } from './App.js';
import {
  Products,
  Product,
  ProductColors,
  ProductColor,
} from './Products.js';
import AuthService from './AuthService.js';

const auth = new AuthService('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'test.auth0.com');

// onEnter callback to validate authentication in private routes
const requireAuth = (nextState, replace) => {
  if (!auth.loggedIn()) {
    console.log('User not authorized. Redirecting to login...');
    replace({ pathname: '/login' });
  }
};

export const routes = (
  <Route path='/' title='App' component={App}>
    <IndexRoute component={Home} />
    <Route path='products' title='App - Products' component={Products}>
      <Route path='first' title='App - Products - First' component={Product} />
      <Route path='second' title='App - Products - Second' component={Product} />

      {/* All routes here require auth */}
      <Route
        path='third'
        title='App - Products - Third'
        onEnter={requireAuth}
        component={Product}>
        <Route path='colors' title='App - Products - Third - Colors' component={ProductColors}>
          <Route path='green' title='App - Products - Third - Colors - Green' component={ProductColor} />
          <Route path='blue' title='App - Products - Third - Colors - Blue' component={ProductColor} />
        </Route>
      </Route>

    </Route>
    <Route path='about' title='App - About' component={About} />
    <Route path='*' title='404: Not Found' component={NotFound} />
  </Route>
);

export default routes;
