import React from 'react';

const getRedirect = ({ reactStaticCompilation }) => {
  return reactStaticCompilation && reactStaticCompilation.redirectLocation;
};

const Html = (props) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, minimum-scale=1.0' />
      <title>Super awesome package</title>
      <script dangerouslySetInnerHTML={{ __html: 'console.log("analytics")' }} />
    </head>
    <body>
      {getRedirect(props) && (
        <h1>
          <strong>{props.reactStaticCompilation.location}</strong>{' '}
          not found. Redirecting you to <strong>{getRedirect(props).pathname}</strong>...
        </h1>
      )}
      <div id='root' dangerouslySetInnerHTML={{ __html: props.body }} />
      <script src='/app.js' />
    </body>
  </html>
);

export default Html;
