/* eslint-disable react/prop-types */
import test from 'ava';
import React from 'react';
import { Route, Link, IndexRoute, Redirect, IndexRedirect } from 'react-router';

/**
 * NOTE: Ava does not pass imported source through babel so trying to import
 * ./src/**  will thrown an error as Node 4.x does not support imports
 */
import { getAllPaths } from './src/utils.js';

// This seems like potentiall a viable solution. Simply pass the nescessary data
// in a `data` prop directly to the component. The type should likely be an
// array, and it could be read from disk, for instance a list of markdown file
// contents that you would read from disk
// const posts = [
//   { title: 'Hey there', body: 'Some really short text' },
//   { title: 'Second post', body: 'I like to write blogs and stuff' },
// ];
//
// <Route path='posts' component={Posts}>
//   <Route path=':postId' component={Post} data={{ postId: posts }} />
// </Route>

const Layout = props => (
  <div>
    <h1>I'm the layout</h1>
    <ul>
      <li>
        <Link to='/about'>About</Link>
      </li>
    </ul>
    {props.children}
  </div>
);

const AppIndex = props => (
  <div>
    <h3>I'm the AppIndex</h3>
    <strong>No children here</strong>
  </div>
);

const About = props => (
  <h3>About page bro</h3>
);
const Products = props => (
  <h3>Product are here</h3>
);

const Product = props => (
  <div>
    <h3>Product are here</h3>
    <p>This is the product description</p>
  </div>
);

const Contact = props => (
  <form>
    <h3>You can contact us here</h3>
    <p>We are very open to your contact</p>
    <input name='email' type='text' placeholder='Email' />
    <textarea name='message' placeholder='Enter your message...' />
    <button type='submit'>Send</button>
  </form>
);

const routes1 = (
  <Route path='/' component={Layout}>
    <IndexRoute component={AppIndex} />
    <Route path='about' component={About} />
    <Route path='products' component={Products} />
    <Route path='contact' component={Contact} />
  </Route>
);

const routes2 = (
  <Route path='/' component={Layout}>
    <Route path='about' component={About} />
    <Route path='products' component={Products}>
      <Route path='zephyr' component={Product} />
      <Route path='sparkles' component={Product} />
      <Route path='jarvis' component={Product} />
    </Route>
    <Route path='contact' component={Contact} />
  </Route>
);

const routes3 = (
  <Route path='/' component={Layout}>
    <Route path='about' component={About} />
    <Route path='products' component={Products}>
      <Route path='zephyr' component={Product}>
        <Route path='nomad' component={Contact} />
      </Route>
    </Route>
  </Route>
);

const routes4 = (
  <Route path='/' component={Layout}>
    <IndexRedirect to='about' />
    <Redirect from='abt' to='about' />
    <Route path='about' component={About} />
    <Route path='products' component={Products} />
    <Route path='contact' component={Contact} />
  </Route>
);

test('Can get all paths from routes using getAllPaths', t => {
  t.deepEqual(getAllPaths(routes1), [
    '/',
    '/about',
    '/products',
    '/contact',
  ]);
  t.deepEqual(getAllPaths(routes2), [
    '/',
    '/about',
    '/products',
    '/products/zephyr',
    '/products/sparkles',
    '/products/jarvis',
    '/contact',
  ]);
  t.deepEqual(getAllPaths(routes3), [
    '/',
    '/about',
    '/products',
    '/products/zephyr',
    '/products/zephyr/nomad',
  ]);

  // Testing IndexRedirect
  t.deepEqual(getAllPaths(routes4), [
    '/', // This is not a real route, but it will be detected anyway b/c of Layout
    '/about',
    '/products',
    '/contact',
  ]);
});
