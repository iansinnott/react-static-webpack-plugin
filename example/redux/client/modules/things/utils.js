import { Map } from 'immutable';

import { FORM_ID } from './index.js';

export const getFormValues = (state) => {
  return state.getIn(['forms', FORM_ID, 'currentValues'], Map());
};
