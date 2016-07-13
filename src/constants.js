export type OptionsShape = {
  routes: string,
  template?: string,
  reduxStore?: string,
  bundle?: string,
  stylesheet?: string,
  favicon?: string,

  src?: string, // Deprecated. Use routes instead
};
