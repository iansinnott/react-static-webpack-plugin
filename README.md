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

## License

MIT © [Ian Sinnott](http://iansinnott.com)
