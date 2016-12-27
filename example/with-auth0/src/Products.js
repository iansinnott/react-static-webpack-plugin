/* eslint-disable react/prop-types */
import React from 'react';

export class Products extends React.Component {
  render() {
    return (
      <div className='Products'>
        <h1>A list of all products</h1>
        <div className='children'>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export class Product extends React.Component {
  render() {
    return (
      <div className='Product'>
        <h2>This is a specific product</h2>
        <div className='children'>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export class ProductColors extends React.Component {
  render() {
    return (
      <div className='ProductColors'>
        <h3>A list of product colors</h3>
        <div className='children'>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export class ProductColor extends React.Component {
  render() {
    return (
      <div className='ProductColor'>
        <h4>A single product color</h4>
      </div>
    );
  }
}
