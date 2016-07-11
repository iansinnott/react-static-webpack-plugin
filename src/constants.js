
// TODO: Should this be hard coded?
export const ROUTES_FILENAME = 'routes.js';
export const outputFilenames = {

};

export type OptionsShape = {
  routes: string,
  template?: string,
  reduxStore?: string,
  bundle?: string,
  stylesheet?: string,
  favicon?: string,

  src?: string, // Deprecated. Use routes instead
};
