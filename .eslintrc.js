module.exports = {
  extends: "zen",
  rules: {
    // Inferred types are fine for now. If flow can't infer it it will yell at
    // us.
    'flowtype/require-parameter-type': [0],
  },
};
