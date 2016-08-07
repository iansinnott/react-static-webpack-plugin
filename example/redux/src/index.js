/* @flow */
import React from 'react';
import { render } from 'react-dom';
import { Router, browserHistory } from 'react-router';
import { Provider } from 'react-redux';

import store from './redux/store.js';
import routes from './routes.js';

render((
  <Provider store={store}>
    <Router routes={routes} history={browserHistory} />
  </Provider>
), document.getElementById('root'));
