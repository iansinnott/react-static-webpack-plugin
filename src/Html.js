import React, { PropTypes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const Html = ({
  title = 'Rainbow Unicorns',
  bundle = '/app.js',
  body = '',
  favicon = '',
  stylesheet = '',
}) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
      <meta name='viewport' content='width=device-width, minimum-scale=1.0' />
      <title>{title}</title>
      {favicon && <link rel='shortcut icon' href={favicon} />}
      {stylesheet && <link rel='stylesheet' href={stylesheet} />}
    </head>
    <body>
      <div id='root' dangerouslySetInnerHTML={{ __html: body }} />
      <script src={bundle} />
    </body>
  </html>
);
Html.propTypes = {
  title: PropTypes.string,
  body: PropTypes.string,
  bundle: PropTypes.string,
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
export const render = props =>
  '<!doctype html>' + renderToStaticMarkup(<Html {...props} />);
