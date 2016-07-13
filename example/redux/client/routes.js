/* @flow */
import React from 'react';
import { Route, IndexRoute } from 'react-router';

import { App, NotFound } from './components/App.js';
import Home, { Who, How } from './components/Pages.js';
import { LogIn, SignUp } from './components/SignUp.js';

/**
 * The route configuration for the whole app.
 */

export const routes = (
  <Route path='/' title='Redux Example | Home' component={App}>
    <IndexRoute component={Home} />

    {/* Pages */}
    <Route path='who' title='Redux Example | Who' component={Who} />
    <Route path='how' title='Redux Example | How' component={How} />

    {/* Account */}
    <Route path='log-in' title='Redux Example | Log In' component={LogIn} />
    <Route path='sign-up' title='Redux Example | Sign Up' component={SignUp} />

    {/* Not Found */}
    <Route path='*' title='Redux Example | Not Found' component={NotFound} />
  </Route>
);

export default routes;
