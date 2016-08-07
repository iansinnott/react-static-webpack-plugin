import React from 'react';
import ReactSpinner from 'react-spinkit';
import classnames from 'classnames/bind';

import s from './Spinner.styl';
const cx = classnames.bind(s);

export const Spinner = ({ className, ...props }) => (
  <div className={cx('Spinner', className)}>
    <ReactSpinner noFadeIn type='three-bounce' {...props} />
  </div>
);
