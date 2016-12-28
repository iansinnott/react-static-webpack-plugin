const React = require('react');
const T = React.PropTypes;

const Html = ({
  title = 'Rainbow Unicorns',
  bundle = 'app.js',
  body = '',
  favicon = 'favicon.ico',
  stylesheet = 'app.css',
}) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>{title}</title>
      {favicon ? <link rel='shortcut icon' href={favicon} /> : null}
      {stylesheet ? <link rel='stylesheet' href={stylesheet} /> : null}
    </head>
    <body>
      <div id='root' dangerouslySetInnerHTML={{ __html: body }} />
      <script src={bundle} />
    </body>
  </html>
);

Html.propTypes = {
  title: T.string,
  bundle: T.string,
  body: T.string,
  favicon: T.string,
  stylesheet: T.string,
};

module.exports = Html;
