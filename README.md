# React Static Webpack Plugin

[![Build Status](https://img.shields.io/circleci/project/iansinnott/react-static-webpack-plugin.svg)](https://circleci.com/gh/iansinnott/react-static-webpack-plugin)
[![react-string-replace.js on NPM](https://img.shields.io/npm/v/react-static-webpack-plugin.svg)](https://www.npmjs.com/package/react-static-webpack-plugin)


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
    app: './client/index.js',
  },

  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
    publicPath: '/',
  },

  plugins: [
    new ReactStaticPlugin({
      routes: './client/index.js', // Path to routes file
      template: './template.js',    // Path to JSX template file
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
import { Router, browserHistory } from 'react-router';

// Since we're rendering static files don't forget to use browser history.
// Server's don't get the URL hash during a request.
import createBrowserHistory from 'history/lib/createBrowserHistory';

// Import your routes so that you can pass them to the <Router /> component
import routes from './routes.js';

render(
  <Router routes={routes} history={browserHistory} />,
  document.getElementById('root')
);
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

For a full examples you can run locally, see the [`example/` directory](example) or the [React Static Boilerplate][boilerplate].

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

#### `routes` (required)

**Type:** `string`

The path to your routes component. Your routes component should be exported either as `routes` or the default: `'./client/routes.js'`

#### `template` (required)

**Type:** `string`

Path to the file that exports your template React component. Example: `./template.js`

With this option you can provide the path to a custom React component that will render the layout for your static pages. The function will be passed an options object that will give you access to the page title and the rendered component:

```js
// template.js
import React from 'react';

const Html = (props) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, minimum-scale=1.0' />
      <title>{props.title}</title>
      <script dangerouslySetInnerHTML={{ __html: 'console.log("analytics")' }} />
    </head>
    <body>
      <div id='root' dangerouslySetInnerHTML={{ __html: props.body }} />
      <script src='/app.js' />
    </body>
  </html>
);

export default Html;
```

**NOTE:** Your template component will be run through Webpack using whatever transformations or loaders you already have set up for the filetype specified. For example, if you are using babel for all JS files then your template file will be run through babel using whatever settings you have set up in `.babelrc`.

**NOTE:** You can pass arbitrary data to your template component by adding to the options object passed when you initialize the plugin:

```js
new ReactStaticPlugin({
  routes: './client/index.js',
  template: './template.js',

  // Some arbitrary data...
  someData: 'Welcome to Webpack plugins',
}),
```

Then access the data within your template component using `props`:

```js
// template.js
import React from 'react';

const Html = (props) => (
  <html lang='en'>
    <head>
      <title>{props.title}</title>
    </head>
    <body>
      <h1>{props.someData}</h1>
      <div id='root' dangerouslySetInnerHTML={{ __html: props.body }} />
      <script src='/app.js' />
    </body>
  </html>
);

export default Html;
```

The `props` object will have everything you passed in the options object to the plugin as well as:

* `body`: A string of HTML to be rendered in the document.
* `title`: A string that is passed from each of your Route components
* `initialState`: If you pass the `reduxStore` option you will get access to the result of calling `store.getState()`. **NOTE:** Since this plugin makes no assumptions about the shape of your app state it is up to you to stringify it and place it in the DOM if you wish to use it.

#### `reduxStore`

**Type:** `string`

**Default:** undefined

The path to your Redux store. This option allows you to pass a store to react-static-webpack-plugin. This allows for Redux support. The store you pass in will be used in tandem with the react-redux `<Provider store={store}>` component to render your Redux app to a static site.

**Examples coming soon**

## Roadmap

- [x] Custom HTML layout option
- [x] Improved testing
- [x] JSX templating support
- [x] Redux support
- [ ] Support for dynamic routes + data (i.e. `<Route path='post/:id' />`)
- [ ] Custom 404 page filename option

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

Now when you `require` or `import` it you will get the local version.

```
npm link react-static-webpack-plugin
```

#### To `test`

```
npm test
```

Runs the suite of Wepback tests.

[boilerplate]: https://github.com/iansinnott/react-static-boilerplate

## License

MIT © [Ian Sinnott](http://iansinnott.com)
