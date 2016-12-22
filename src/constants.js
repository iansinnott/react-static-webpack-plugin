/* @flow */
export type OptionsShape = {
  routes: string,
  template?: string,
  reduxStore?: string,
  renderToStaticMarkup?: boolean,
  bundle?: string,
  stylesheet?: string,
  favicon?: string,

  src?: string, // Deprecated. Use routes instead
};

type RedirectLocation = {
  pathname: string,
  search: string,
  hash: string,
  query: Object,
  key: string,
  action: string, // Actually an emum, but i'm not sure what all the values are: 'REPLACE' | ...
  state: ?Object,
};

type RenderProps = {
  router: Object,
  location: Object,
  routes: Array<any>,
  params: Object,
  components: Array<any>,
  createElement: Function,
};

export type MatchShape = {
  error: Error,
  renderProps: ?RenderProps,
  redirectLocation: ?RedirectLocation,
};
