/* @flow */
import type { Map } from 'immutable';

export type Action = {
  type: string,
  payload?: any,
};

export type Dispatch = (a: Action) => void;

export type Store = {
  dispatch: Dispatch,
  getState: () => Map,
};

