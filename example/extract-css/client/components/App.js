import React, { PropTypes } from 'react';
import 'normalize.css';

// Using CSS Modules so we assign the styles to a variable
import s from './App.styl';

// Favicon link is in the template, this just makes webpack package it up for us
import './favicon.ico';

/**
 * NOTE: As of 2015-11-09 react-transform does not support a functional
 * component as the base compoenent that's passed to ReactDOM.render, so we
 * still use createClass here.
 */
export const App = React.createClass({
  render() {
    return (
      <div className={s.App}>
        <img src='https://facebook.github.io/react/img/logo.svg' alt='React Logo' />
        <p>Big wins</p>
      </div>
    );
  },
});
