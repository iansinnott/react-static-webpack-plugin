![React Static Boilerplate](http://dropsinn.s3.amazonaws.com/Screen%20Shot%202016-01-03%20at%208.39.55%20PM.png)

# React Static Boilerplate (Barebones)

A barebones boilerplate for building [React][] applications

**Quick Start:**

* `git clone https://github.com/iansinnott/react-static-boilerplate my-site && cd my-static-site`
* `git checkout barebones && rm -rf .git`
* `npm install`
* `npm start` to run a dev server
* Write an awesome client-side app...
* `npm build` to minify, package and generate files

## Opinionated styling

This boilerplate is slightly opinionated, especially when it comes to CSS. Don't worry, you can easily change any of this but by default I use [Stylus][] and [CSS Modules][] for compiling CSS.

### Stylus

There is certainly no need to use Stylus for styling your static pages. Use whatever you like best. But Stylus does support standard CSS syntax so if you don't want to set up anything new just start writing CSS in any of the `*.styl` files and watch it compile as expected :satisfied:

This boilerplate uses Stylus for page styling by default. It's pretty simple to swap out stylus for Sass, Less or even plain CSS. Just update the Webpack config files (both `webpack.config.dev.js` and `webpack.config.prod.js`) to use your loader of choice. If you're not sure how to do this check out the [Webpack loaders documentation](https://webpack.github.io/docs/loaders.html).

### CSS Modules

CSS Modules are provided as part of the css-loader itself. For more info check out the [CSS Loader docs][css-loader-modules]. If you haven't heard of CSS Modules check out [GitHub repo][CSS Modules]. Basically it lets you write styles local to any component or file. In my experience it makes styling much more pleasant and much less error prone. 

Of course **if you don't want to use this feature you don't have to.**

To disable CSS modules you just need to replace to Webpack config lines for dev and prod:

```js
// webpack.config.dev.js

// Replace this...
'css?modules&importLoaders=2&localIdentName=[name]__[local]__[hash:base64:6]',

// ...with this.
'css',
```

```js
// webpack.config.prod.js

// Replace this...
loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=2!autoprefixer!stylus'),

// ...with this.
loader: ExtractTextPlugin.extract('style', 'css!autoprefixer!stylus'),
```

## Technology Used

For further reading on the primary tech used in this boilerplate see the links below:

* [Webpack][]
* [Babel][]
* [React][]
* [Stylus][]
* [CSS Modules][]

## Troubleshooting

### Babel Env

 Make sure `BABEL_ENV` is not set to `development` when building. If it is babel will likely throw a hot module replacement error since HMR transformations are getting run on everything that goes through babel.

### Font Awesome Webpack

The `font-awesome-webpack` module does not seem to work with the approach of generating files as UMD modules then requiring them from the public dir. It throws an error about window not being defined.

[React]: http://facebook.github.io/react/
[Webpack]: http://webpack.github.io/
[Babel]: https://babeljs.io/
[Stylus]: https://learnboost.github.io/stylus/
[CSS Modules]: https://github.com/css-modules/css-modules
[css-loader-modules]: https://github.com/webpack/css-loader#css-modules
[Express]: http://expressjs.com/
[Waterline]: https://github.com/balderdashy/waterline
[Flux]: https://facebook.github.io/flux/docs/overview.html
[React Router]: https://github.com/rackt/react-router
[Redux]: https://github.com/rackt/redux
[Docker Compose]: https://docs.docker.com/compose/

