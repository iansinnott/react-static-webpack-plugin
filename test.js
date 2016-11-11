/* eslint-disable react/prop-types */
import test from 'ava';
import React from 'react';
import { Route, Link, IndexRoute, Redirect, IndexRedirect } from 'react-router';

/**
 * NOTE: Ava does not pass imported source through babel so trying to import
 * ./src/**  will thrown an error as Node 4.x does not support imports
 */
import { getAllPaths, getAssetKey } from './src/utils.js';

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

const NotFound = props => (
  <h3>Nothing to see here</h3>
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

test('getAssetKey', t => {
  t.is(getAssetKey('/'), 'index.html');
  t.is(getAssetKey('/about'), 'about.html');
  t.is(getAssetKey('/about/team'), 'about/team.html');
  t.is(getAssetKey('/about/team/bios/'), 'about/team/bios/index.html');
});

test('Ignores index routes when generating paths', t => {
  const routes = (
    <Route path='/' component={Layout}>
      <IndexRoute component={AppIndex} />
      <Route path='about' component={About} />
      <Route path='products' component={Products} />
      <Route path='contact' component={Contact} />
    </Route>
  );

  const paths = getAllPaths(routes);

  t.deepEqual(paths, [
    '/',
    '/about',
    '/products',
    '/contact',
  ]);

  t.deepEqual(paths.map(getAssetKey), [
    'index.html',
    'about.html',
    'products.html',
    'contact.html',
  ]);
});

test('Can get paths from nested routes', t => {
  const routes = (
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

  const paths = getAllPaths(routes);

  t.deepEqual(paths, [
    '/',
    '/about',
    '/products',
    '/products/zephyr',
    '/products/sparkles',
    '/products/jarvis',
    '/contact',
  ]);

  t.deepEqual(paths.map(getAssetKey), [
    'index.html',
    'about.html',
    'products.html',
    'products/zephyr.html',
    'products/sparkles.html',
    'products/jarvis.html',
    'contact.html',
  ]);
});

test('Can get deeply nested route paths', t => {
  const routes = (
    <Route path='/' component={Layout}>
      <Route path='about' component={About} />
      <Route path='products' component={Products}>
        <Route path='zephyr' component={Product}>
          <Route path='nomad' component={Contact} />
        </Route>
      </Route>
    </Route>
  );

  const paths = getAllPaths(routes);

  t.deepEqual(paths, [
    '/',
    '/about',
    '/products',
    '/products/zephyr',
    '/products/zephyr/nomad',
  ]);

  t.deepEqual(paths.map(getAssetKey), [
    'index.html',
    'about.html',
    'products.html',
    'products/zephyr.html',
    'products/zephyr/nomad.html',
  ]);
});

test('Ignores IndexRedirect', t => {
  const routes = (
    <Route path='/' component={Layout}>
      <IndexRedirect to='about' />
      <Redirect from='abt' to='about' />
      <Route path='about' component={About} />
      <Route path='products' component={Products} />
      <Route path='contact' component={Contact} />
    </Route>
  );

  const paths = getAllPaths(routes);

  t.deepEqual(paths, [
    '/', // This is not a real route, but it will be detected anyway b/c of Layout
    '/about',
    '/products',
    '/contact',
  ]);

  t.deepEqual(paths.map(getAssetKey), [
    'index.html',
    'about.html',
    'products.html',
    'contact.html',
  ]);
});


test('Can utilize not found route', t => {
  const routes = (
    <Route path='/' component={Layout}>
      <IndexRoute title='Reactathon' component={Products} />
      <Route path='about' title='App - About' component={Product} />
      <Route path='code-of-conduct' title='App - Code of Conduct' component={About} />
      <Route path='sponsors' title='App - Sponsors' component={Contact} />
      <Route path='*' title='404: Not Found' component={NotFound} />
    </Route>
  );

  const paths = getAllPaths(routes);

  t.deepEqual(paths, [
    '/',
    '/about',
    '/code-of-conduct',
    '/sponsors',
    '/*',
  ]);

  t.deepEqual(paths.map(getAssetKey), [
    'index.html',
    'about.html',
    'code-of-conduct.html',
    'sponsors.html',
    '404.html',
  ]);
});
