# 1.0.0

This was a major overhaul and includes many improvements as well as some breaking changes:

**Improvements**

* Support for Redux (#7)
* Support for JSX templates (#3)
* All assets including templates are compiled through Webpack
* Improved testing. Will help minimize breakage as new features are added in the future.

**Breaking Changes**

If you are upgrading to 1.x from 0.x you will need to make some changes.

* The `src` option has now been replaced by `routes`
* The `template` option is now required and uses JSX instead of string interpolation

## Upgrade Guide

**v0.x**

```js
new StaticSitePlugin({
  src: 'app',             // Chunk or file name
  bundle: '/app.js',      // Path to JS bundle
  stylesheet: '/app.css', // Path to stylesheet (if any)
})
```

**v1.x**

```js
new StaticSitePlugin({
  routes: './src/routes.js',
  template: './template.js',
})
```

#### `src` replace with `routes`

Now instead of specifying a `src` path you should specify the path to your routes configuration file as shown in the example above. No more chunk names, just the path to the file. Hopefully this will clear up confusion and allow for cleaner client-side code that does not need to account for whether or not it is being run in a browser or a compiler.

#### `template` is mandatory

To further simply the processing of static files the template option is now mandatory. Below you can find a working template file that you can copy in to your project to make the transition easier. Since almost every project needed to supply a custom template anyway this seems like the logical option. It also makes it no longer necessary to specify things like `stylesheet`, `bundle` or `favicon` in the plugin options.

The file specified in the `template` option should now be a react component to be rendered with `React.renderToStaticMarkup`. See the example below:

```js
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

Note the `props.title` and `props.body` in the template above. These are still important and in the case of `props.body`, necessary for the functionality of the component.

#### `stylesheet`, `bundle`, `favicon`, removed

These are now no longer official options. If you wish to specify them they will still be passed to your template but it is no longer necessary or even recommended. Since the template option is now mandatory you can simply add the appropriate tags to the head of your document. See the above point about the `template` option for more details.
