/* @flow */
import type { Store, Dispatch } from './types.js';

function isPromise(x: any) {
  return x && typeof x.then === 'function';
}

function isAsyncAction(action) {
  return isPromise(action.promise) && Array.isArray(action.types);
}

export default function promiseMiddleware({ dispatch }: Store) {
  return (next: Dispatch) => (action: any) => {
    // If given a promise, use it and dispatch the result
    if (isPromise(action)) {
      return action.then(dispatch);
    }

    // If this is a three-action triplet then treat is at such. This is the real
    // meat of this middleware
    if (isAsyncAction(action)) {
      const [ REQUEST, SUCCESS, FAILURE ] = action.types;
      dispatch({ type: REQUEST });
      return action.promise.then(
        result => dispatch({ type: SUCCESS, payload: result }),
        error => {
          dispatch({ payload: error, error: true, type: FAILURE });
          return Promise.reject(error);
        }
      );
    }

    // Otherwise just pass the action on
    return next(action);
  };
}
