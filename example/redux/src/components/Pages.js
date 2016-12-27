/* @flow */
import React from 'react';
import classnames from 'classnames/bind';
import { connect } from 'react-redux';
import { Map } from 'immutable';

import { getFormValues } from '../modules/things/utils.js';
import { updateForm, initialize, teardown, addThing } from '../modules/things';

import s from './Pages.styl';
const cx = classnames.bind(s);

export class Who extends React.Component {
  render() {
    return (
      <div className={cx('page')}>
        <div className={cx('siteTitle')}>
          <h1>Who are we?</h1>
        </div>
        <p>We're awesome.</p>
      </div>
    );
  }
}

export class How extends React.Component {
  render() {
    return (
      <div className={cx('page')}>
        <div className={cx('siteTitle')}>
          <h1>How it works</h1>
        </div>
        <p>It works because you log in and we agregate your data :D.</p>
      </div>
    );
  }
}

class Home extends React.Component {
  componentDidMount() {
    this.props.dispatch(initialize());
  }

  componentWillUnmount() {
    this.props.dispatch(teardown());
  }

  handleFormChange = (e) => {
    const { value } = e.target;
    this.props.dispatch(updateForm('thing', value));
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const { formValues } = this.props;
    this.props.dispatch(addThing({ text: formValues.get('thing') }));
    this.props.dispatch(updateForm('thing', ''));
  };

  render() {
    const { formValues, things } = this.props;
    return (
      <div className={cx('page')}>
        <div className={cx('siteTitle')}>
          <h1>This is the home page</h1>
        </div>
        <p>It's a great page.</p>
        <form onSubmit={this.handleSubmit} className={cx('form')}>
          <input
            name='input'
            value={formValues.get('thing', '')}
            onChange={this.handleFormChange}
            placeholder='Enter a new thing...'
            type='text' />
        </form>
        <div className={cx('things')}>
          {things.valueSeq().map(x => (
            <p key={x.id}>{x.text}</p>
          ))}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    things: state.getIn(['things', 'data'], Map()),
    formValues: getFormValues(state),
  };
};

export default connect(mapStateToProps)(Home);
