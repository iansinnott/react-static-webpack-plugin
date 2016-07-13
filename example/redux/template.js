import React from 'react';

const Html = (props) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, minimum-scale=1.0' />
      <link rel='stylesheet' type='text/css' href='https://fonts.googleapis.com/css?family=Playfair+Display:700italic,700|Open+Sans:400,400italic' />
      <link rel='stylesheet' type='text/css' href='/app.css' />
      <link rel='icon' type='image/x-icon' href='/favicon.ico' />
      <title>{props.title}</title>

      {/*
        Pass the initial state to our template so that our store can grab it
        from the window object on initialization.

        NOTE: In this example we use Immutable.js, so we need to call toJS on
        state. However, if you are not using Immutable this will not be necessary
      */}
      <script dangerouslySetInnerHTML={{ __html: `window.__initial_state = ${JSON.stringify(props.initialState.toJS())}` }} />
    </head>
    <body>
      <div id='root' dangerouslySetInnerHTML={{ __html: props.body }} />
      <script src='/app.js' />
    </body>
  </html>
);

export default Html;
