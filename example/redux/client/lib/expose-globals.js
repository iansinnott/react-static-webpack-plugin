if (process.env.NODE_ENV === 'development') {
  window.React = require('react');
  window.Redux = require('redux');
  window.axios = require('axios');
  window.Immutable = require('immutable');

  window.store = require('../redux/store.js');
  window.Things = require('../modules/things');
}
