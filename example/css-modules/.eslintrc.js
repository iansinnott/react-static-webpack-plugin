module.exports = {
  extends: 'rackt',
  plugins: [
    'react',
  ],
  rules: {
    'semi': [1, 'always'],                   // Use semicolons
    'comma-dangle': [1, 'always-multiline'], // Use semicolons
    'jsx-quotes': [1, 'prefer-single'],      // Single quotes on JSX components
    'react/prop-types': 1,                   // Warn about missing prop types
    'react/react-in-jsx-scope': 2,           // Require React be in scope when authoring JSX
    'react/jsx-uses-react': 2,               // React doesn't have to be used explicitly b/c JSX
    'react/jsx-uses-vars': 2,                // Prevent no-unused-vars issues with JSX components
  },
}
