import React, { PropTypes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const Html = ({
  title = 'Redux Example',
  bundle = '/app.js',
  body = '',
  favicon = '',
  stylesheet = '',
}) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>{title}</title>
      <link rel='stylesheet' type='text/css' href='https://fonts.googleapis.com/css?family=Playfair+Display:700italic,700|Open+Sans:400,400italic' />
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
  title: PropTypes.string,
  bundle: PropTypes.string,
  body: PropTypes.string,
  favicon: PropTypes.string,
  stylesheet: PropTypes.string,
};

/**
 * Render the entire web page to a string. We use render to static markup here
 * to avoid react hooking on to the document HTML that will not be managed by
 * React. The body prop is a string that contains the actual document body,
 * which react will hook on to.
 *
 * We also take this opportunity to prepend the doctype string onto the
 * document.
 *
 * @param {object} props
 * @return {string}
 */
export const renderDocumentToString = props => {
  return `<!doctype html>${renderToStaticMarkup(<Html {...props} />)}`;
};

