import React, { PropTypes } from 'react';
import { Link, IndexLink } from 'react-router';

export const Home = React.createClass({
  render() {
    return (
      <div>
        <div>
          <h1>React Static Boilerplate</h1>
        </div>
        <p>Why React static?</p>
        <ul>
          <li><span>Dev</span> friendly</li>
          <li><span>User</span> friendly</li>
          <li><span>SEO</span> friendly</li>
        </ul>
      </div>
    );
  },
});

export const About = React.createClass({
  render() {
    return (
      <div>
        <div>
          <h1>About</h1>
        </div>
        <p>Welcome, to about us.</p>
      </div>
    );
  },
});

export const NotFound = React.createClass({
  render() {
    return (
      <div>
        <h4>Not found</h4>
      </div>
    );
  },
});

/**
 * NOTE: As of 2015-11-09 react-transform does not support a functional
 * component as the base compoenent that's passed to ReactDOM.render, so we
 * still use createClass here.
 */
export const App = React.createClass({
  propTypes: {
    children: PropTypes.any,
  },
  render() {
    return (
      <div>
        <nav>
          <IndexLink to='/' activeClassName={'active'}>Home</IndexLink>
          <Link to='/about' activeClassName={'active'}>About</Link>
        </nav>
        {this.props.children}
      </div>
    );
  },
});
