/* @flow */
import React from 'react';
import classnames from 'classnames/bind';

import s from './SignUp.styl';
const cx = classnames.bind(s);

export class LogIn extends React.Component {
  render() {
    return (
      <div className={cx('page')}>
        <div className={cx('siteTitle')}>
          <h1>Log In</h1>
        </div>
        <p>Log in now. It's fast and free!</p>
      </div>
    );
  }
}

export class SignUp extends React.Component {
  render() {
    return (
      <div className={cx('page')}>
        <div className={cx('siteTitle')}>
          <h1>Sign Up</h1>
        </div>
        <p>Sign up right here.</p>
      </div>
    );
  }
}
