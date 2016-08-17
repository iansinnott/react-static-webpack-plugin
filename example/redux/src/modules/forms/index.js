/* @flow */
import { Map, fromJS } from 'immutable';

const REGISTER_FORM = 'redux-example/forms/REGISTER_FORM';
const UNREGISTER_FORM = 'redux-example/forms/UNREGISTER_FORM';
const UPDATE_FORM = 'redux-example/forms/UPDATE_FORM';

const initialState = Map({});

/* **************************************************************************
 * Reducer
 * *************************************************************************/

export default function reducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
  case REGISTER_FORM:
    const initialValues = payload.initialValues
      ? fromJS(payload.initialValues)
      : Map({});
    return state.set(payload.id, fromJS({
      initialValues,
      currentValues: initialValues,
    }));
  case UNREGISTER_FORM:
    return state.delete(payload);
  case UPDATE_FORM:
    return state.setIn(payload.keypath, payload.value);
  default:
    return state;
  }
}

/* **************************************************************************
 * Action Creators
 * *************************************************************************/

/**
 * type initialForm = { id: string, initialValues: Object | Map }
 */
export function registerForm(initialForm) {
  return {
    type: REGISTER_FORM,
    payload: initialForm,
  };
}

/**
 * type formId: string
 */
export function unregisterForm(formId) {
  return {
    type: REGISTER_FORM,
    payload: formId,
  };
}

/**
 * type update = { keypath: string[], value: string | number | boolean }
 */
export function updateForm(update) {
  return {
    type: UPDATE_FORM,
    payload: update,
  };
}
