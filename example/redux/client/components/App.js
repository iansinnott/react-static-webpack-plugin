/* @flow */
import React, { PropTypes } from 'react';
import { Link, IndexLink } from 'react-router';
import 'normalize.css/normalize.css';
import classnames from 'classnames/bind';
import 'react-fa';

// Using CSS Modules so we assign the styles to a variable
import s from './App.styl';
const cx = classnames.bind(s);
import '../lib/expose-globals.js';

// Favicon link is in the template, this just makes webpack package it up for us
import './favicon.ico';

export class NotFound extends React.Component {
  render() {
    return (
      <div className={cx('page')}>
        <h4>Not found</h4>
      </div>
    );
  }
}

export class Home extends React.Component {
  render() {
    return (
      <div className='Home'>
        h
      </div>
    );
  }
}

const NavLink = (props) => (
  <Link activeClassName={cx('active')} {...props} />
);

class Header extends React.Component {
  render() {
    return (
      <nav className={cx('Header')}>
        <IndexLink to='/' className={cx('logo')}>
          <img src={require('./logo-full.svg')} />
        </IndexLink>
        <div className={cx('middle')}>
          <NavLink to='/who'>Who Are We?</NavLink>
          <NavLink to='/how'>How it Works</NavLink>
        </div>
        <div className={cx('right')}>
          <NavLink to='/log-in' className={cx('logIn')}>Log In</NavLink>
          <NavLink to='/sign-up' className={cx('signUp')}>Sign Up</NavLink>
        </div>
      </nav>
    );
  }
}

class Footer extends React.Component {
  handleSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.email;
    const email = input.value.trim();
    console.log(`Enrolling ${email}...`);
    input.value = '';
  };

  render() {
    return (
      <div className={cx('Footer')}>
        <div className={cx('cols')}>
          <div className={cx('col')}>
            <img className={cx('logo')} src={require('./logo-full.svg')} />
            <h4>Create & Discover inspired React Apps.</h4>
            <form onSubmit={this.handleSubmit}>
              <p>Sign Up for Inspiration & Ideas!</p>
              <input
                placeholder='your@email.com'
                type='email' />
              <button
                type='submit'>
                Sign Up
              </button>
            </form>
          </div>
          <div className={cx('col')}>
            <h4>About</h4>
            <NavLink to='/who'>About Us</NavLink>
            <NavLink to='/how'>How it Works</NavLink>
            <NavLink to='/investors'>Investors</NavLink>
            <NavLink to='/press'>Press</NavLink>
          </div>
          <div className={cx('col')}>
            <h4>Customer Care</h4>
            <NavLink to='/contact'>Contact Us</NavLink>
            <NavLink to='/privacy'>Privacy Policy</NavLink>
            <NavLink to='/terms'>Terms of Use</NavLink>
          </div>
          <div className={cx('col')}>
            <h4>Community</h4>
            <NavLink to='/blog'>Our Blog</NavLink>
          </div>
          <div className={cx('col', 'social')}>
            <div className={cx('icons')}>
              <a href='facebook.com'>
                <img src={require('../lib/fb-icon.svg')} />
              </a>
              <a href='twitter.com'>
                <img src={require('../lib/twitter-icon.svg')} />
              </a>
              <a href='google.com'>
                <img src={require('../lib/gplus-icon.svg')} />
              </a>
            </div>
            <h4>Language</h4>
            <select
              id='language'
              name='language'>
              <option value='en-us'>English</option>
              <option value='zh-tw'>繁體中文</option>
            </select>
            <h4>Currency</h4>
            <select
              id='currency'
              name='currency'>
              <option value='usd'>US Dollar</option>
              <option value='ntd'>New Taiwan Dollar</option>
            </select>
          </div>
        </div>
        <div className={cx('copy')}>
          <small>{process.env.__VERSION__}</small>
          <small>© {new Date().getFullYear()} React Example</small>
        </div>
      </div>
    );
  }
}

export class App extends React.Component {
  static propTypes = {
    children: PropTypes.any,
  };

  render() {
    return (
      <div className={cx('App')}>
        <Header />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}

export default App;
