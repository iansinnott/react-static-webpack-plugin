# React Static Webpack Plugin

_Build full static sites using React, React Router and Webpack_

> This module can be added to exiting projects, but if you're looking to start coding right now check out the [React Static Boilerplate][boilerplate].

## Install

```
$ npm install --save-dev react-static-webpack-plugin
```

## Usage

### Simple Example

```js
// webpack.config.js
const ReactStaticPlugin = require('react-static-webpack-plugin');

module.exports = {

  entry: {
    app: ['./client/index.js'],
  },

  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',                
    libraryTarget: 'umd', // IMPORTANT! You must output to UMD for the plugin to work
    publicPath: '/',
  },

  plugins: [
    new ReactStaticPlugin({
      src: 'app',             // Chunk or file name
      bundle: '/app.js',      // Path to JS bundle
      stylesheet: '/app.css', // Path to stylesheet (if any)
    }),
  ],

  // ... other config

};
```

```js
// client/index.js
import React from 'react';
import { render } from 'react-dom';
import App from './components/App.js';

// Don't try to render unless we're in the browser
if (typeof document !== 'undefined')
  render(<App />, document.getElementById('root'));

// Be sure to export the React component so that it can be statically rendered
export default App;
```

Now when you run `webpack` you will see `index.html` in the output. Serve it statically and open it in any browser. 

### Multi-page sites with React Router

Creating sites with multiple static pages using React Router is very similar to the simple example, but instead of exporting any old React component export a `<Route />` component:

```js
// client/index.js
import React from 'react';
import { render } from 'react-dom';
import { Router } from 'react-router';

// Since we're rendering static files don't forget to use browser history.
// Server's don't get the URL hash during a request.
import createBrowserHistory from 'history/lib/createBrowserHistory';

// Import your routes so that you can pass them to the <Router /> component
import routes from './routes.js';

// Only render in the browser
if (typeof document !== 'undefined') {
  render(
    <Router routes={routes} history={createBrowserHistory()} />,
    document.getElementById('root')
  );
}

// Export the routes here so that ReactStaticPlugin can access them and build
// the static files.
export * from './routes.js';
```

```js
// client/routes.js
import React from 'react';
import { Route } from 'react-router';

import {
  App,
  About,
  Products,
  Product,
  Contact,
  Nested,
} from './components';

const NotFound = () => <h4>Not found 😞</h4>;

export const routes = (
  <Route path='/' title='App' component={App}>
    <Route path='about' title='App - About' component={About} />
    <Route path='contact' title='App - Contact' component={Contact} />
    <Route path='products' title='App - Products' component={Products}>
      <Route path='product' title='App - Products - Product' component={Product}>
        <Route path='nested' title='App - Products - Product - Nested' component={Nested} />
      </Route>
    </Route>
    <Route path='*' title='404: Not Found' component={NotFound} />
  </Route>
);

export default routes;
```

**NOTE:** The `title` prop on the `<Route />` components is totally optional but recommended. It will not affect your client side app, only the `<title>` tag of the generated static HTML. 

Now you will see nested HTML files int the `webpack` output. Given our router example it would look something like this:

```
                     Asset       Size  Chunks             Chunk Names
                index.html  818 bytes          [emitted]
                    app.js     797 kB       0  [emitted]  app
                   app.css    8.28 kB       0  [emitted]  app
                about.html    1.05 kB          [emitted]
              contact.html    1.46 kB          [emitted]
             products.html    2.31 kB          [emitted]
      products/zephyr.html    2.45 kB          [emitted]
products/zephyr/nomad.html    2.53 kB          [emitted]
                  404.html  882 bytes          [emitted]
```

**NOTE:** When the plugin encounters `<Route path='*' />` it will assume that this is the 404 page and will name it `404.html`.

### Full Example

For a full example you can run locally see the [React Static Boilerplate][boilerplate].

## Current Limitations

This plugin does not currently support all the functionality of react router.
Most notably it does not support dynamic route paths. For example:

```js
<Route path='blog' component={Blog}>
  <Route path=':id' component={Post} />
</Route>
```

In a standard single page app when you hit the `Post` component you would probably look at the ID in the URL and fetch the appropriate post. However, to build static files we need all data available to us at the time of compilation, and in this case I have yet to come up with a clever way of passing dynamic data to the plugin and correctly mapping it to HTML files.

I have some thoughts on this and am actively exploring how it might work but nothing has been implemented yet. If you have any thoughts on what this might look like please [open an issue][issues] and let me know!

[issues]: https://github.com/iansinnott/react-static-webpack-plugin/issues

## API

### `new ReactStaticPlugin({ ...options })`

#### `src` (required)

**Type:** `string`

The name of the chunk or file that exports your app's React Router config. Example: `'app'`

#### `bundle`

**Type:** `string`

**Default:** `'/app.js'`

Path to your bundled application. This is not required but you will most likely need to specify a path to your `bundle` unless it happens to be the default.

#### `stylesheet`

**Type:** `string`

**Default:** `'/app.css'`

Path to your external stylesheet, if any.

#### `favicon`

**Type:** `string`

**Default:** `''`

Path to your favicon, if any. Example `'/favicon.ico'`

## Roadmap

- [ ] Custom HTML layout option
- [ ] Custom 404 page filename option
- [ ] Support for dynamic routes + data (i.e. `<Route path='post/:id' />`)
- [ ] Improved testing

## Development

The source for this plugin is transpiled using Babel. Most importantly this allows us to use JSX, but it also provides access to all ES6 features. During development you probably want to watch the source files and compile them whenever they change. To do this:

#### To `watch`

```
npm run watch
```

#### To `build`

```
npm run build
```

Make sure to run the project locally to be sure everything works as expected (we don't yet have a test suite). To do this link this repo locally using NPM. From the source directory:

```
npm link .
```

Then you can link it within any local NPM project:

```
npm link react-static-webpack-plugin
```

Now when you `require` or `import` it you will get the local version.

[boilerplate]: https://github.com/iansinnott/react-static-boilerplate

## License

MIT © [Ian Sinnott](http://iansinnott.com)
