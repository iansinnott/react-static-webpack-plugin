![React Static Boilerplate](http://dropsinn.s3.amazonaws.com/Screen%20Shot%202016-01-03%20at%208.39.55%20PM.png)

# React Static Boilerplate

A boilerplate for building static sites with [React][] and [React Router][]

**Quick Start:**

* `git clone https://github.com/iansinnott/react-static-boilerplate my-static-site`
* `cd my-static-site && rm -rf .git`
* `npm install`
* `npm start` to run a dev server
* Write an awesome client-side app...
* `npm run build` to minify, package and generate static HTML files from your routes

Now you're all set to deploy to your favorite hosting solution :beers:

**NOTE:** It's important to run `npm run build` and **not** `npm build`. The latter will silently exit because it is a native NPM command.

## Project Goals

* A single source of truth: Your routes
* Intuitive. Leverage existing font-end knowledge
* Awesome developer experience
* Flexible. No file structure or naming conventions required. Use whatever modules you want

## Dynamic Routes

**Iportant Note:** This boilerplate does not yet support generating static sites for dynamic routes such as `post/:id`. That's the next major feature addition (see the [Roadmap below](#roadmap)) but it hasn't been implemented yet.

For more info see [this issue on the react-static-webpack-plugin repo](https://github.com/iansinnott/react-static-webpack-plugin/issues/2).

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


## Serving static files

This project will generate all the static files you need to server a full, production-ready website. However your server will likely need some configuration so that it maps the same URLs React Router uses to actual static files. For example, the "about" page might have the following URL according to React Router: `/about`.

However, a static server without any configuration would see the URL `/about` and return a 404 because it expects a URL of `/about.html` to actually server the file. There are many ways to handle this on different systems. Here is how you might handle it with Nginx.

### Nginx

This project contains a script to help generate a usable Nginx config. To run it:

```
npm run -s conf
```

This will output the config to stdout. Redirect it as you see fit to save it to disk:

```
npm run -s conf > my-site.conf
```

Once you've saved the file you can sym link it into place and reload Nginx. This is just an example, your path to Nginx will vary based on system:

```
ln -s $PWD/my-site.conf /path/to/nginx/conf-files/static-fun.conf
nginx -s reload
```

### Testing the static site with Docker

First, make sure you [have Docker installed](https://www.docker.com/products/docker-toolbox) and running on your system. Then proceed.

This repository includes a Docker Compose config file for quickly setting up an Nginx server to test your static site. To run it, simply run:

```
npm run -s conf > nginx.conf
docker-compose up
```

Now run `docker ps` to get the IP address and port where the container is running. If you're using Docker Machine this will likely be something like `192.168.99.100:8080`.

### Testing the static site with Nginx on a Mac

If you don't have Nginx yet install it with `brew`:

```
brew install nginx
```

Now generate an Nginx config file using the script in this project:

```
npm run -s conf > nginx.conf
```

Then link that file we just created in to the global Nginx config file and reload Nginx:

```
mkdir -p /usr/local/etc/nginx/servers
ln -s $PWD/nginx.conf /usr/local/etc/nginx/servers/static-fun.conf
nginx -s reload
```

## Technology Used

For further reading on the primary tech used in this boilerplate see the links below:

* [Webpack][]
* [Babel][]
* [React][]
* [React Router][]
* [Stylus][]
* [CSS Modules][]

## Roadmap

- [x] Add [Docker Compose][] to run a production-like server on demand for manual testing
- [x] Add readme docs for testing a prod site with Docker and Docker compose
- [ ] Support for [dynamic content](https://github.com/iansinnott/react-static-webpack-plugin/issues/2)
- [ ] Leverage code splitting for efficient bundling and async module loading
- [ ] Improved SVG tooling

## Redux

Interested in using Redux? Check out [this pull request](https://github.com/iansinnott/react-static-boilerplate/pull/9) and if you have issues feel free to open a [new Issue][]

[new Issue]: https://github.com/iansinnott/react-static-boilerplate/issues/new

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

