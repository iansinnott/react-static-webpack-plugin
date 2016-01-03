# React Static Webpack Plugin

_Build full static sites using React, React Router and Webpack_

## Install

```
$ npm install --save react-static-webpack-plugin
```


## Usage

```js
const ReactStaticPlugin = require('react-static-webpack-plugin');

module.exports = {

  entry: {
    app: ['./client/index.js'],
  },

  plugins: [
    new ReactStaticPlugin({ src: 'app' }), // Chunk or file name
  ],

  // ... other config

};
```

## API

### `new ReactStaticPlugin({ ...options })`

#### `src`

Type: `string`

The name of the chunk or file that exports your app's React Router config. Example: `'app'`

#### `bundle`

Type: `string`

Path to your bundled application. Example: `'/app.js'`

#### `stylesheet`

Type: `string`

Path to your external stylesheet, if any. Example `'/app.css'`

#### `favicon`

Type: `string`

Path to your favicon, if any. Example `'/favicon.ico'`

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

## License

MIT © [Ian Sinnott](http://iansinnott.com)
