import React from 'react';
// import 'normalize.css';

// Using CSS Modules so we assign the styles to a variable
import './App.css';

// Favicon link is in the template, this just makes webpack package it up for us
// import './favicon.ico';

/**
 * NOTE: As of 2015-11-09 react-transform does not support a functional
 * component as the base compoenent that's passed to ReactDOM.render, so we
 * still use createClass here.
 */
class App extends React.Component {
  render() {
    return (
      <div className='App'>
        <img src='https://facebook.github.io/react/img/logo.svg' alt='React Logo' />
        <p>Big wins</p>
      </div>
    );
  }
}

export default App;
