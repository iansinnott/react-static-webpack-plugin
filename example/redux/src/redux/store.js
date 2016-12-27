/* @flow */
import { createStore, applyMiddleware } from 'redux';
import { combineReducers } from 'redux-immutable';
import { Map } from 'immutable';

import loggerMiddleware from './loggerMiddleware.js';
import promiseMiddleware from './promiseMiddleware.js';
import things from '../modules/things';
import forms from '../modules/forms';

const reducer = combineReducers({
  things,
  forms,
});

const middlewares = [promiseMiddleware];

if (process.env.NODE_ENV === 'development') {
  middlewares.push(loggerMiddleware);
}

// NOTE: This is where we could read initial state from the window object if we
// decided to stringify it in our template. See template.js for details.
const store = createStore(reducer, Map(), applyMiddleware(...middlewares));

export default store;
