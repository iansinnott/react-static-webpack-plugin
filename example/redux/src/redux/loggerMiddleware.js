/* @flow */
import type { Store, Action } from './types.js';

export default function loggerMiddleware(store: Store) {
  return (next: Function) => (action: Action) => {
    console.group(action.type);
    console.info('dispatching', action);
    let result = next(action);
    console.log('next state', store.getState().toJS()); // Because we're using Immutable
    console.groupEnd(action.type);
    return result;
  };
}


