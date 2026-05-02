/* eslint-env node */
/* global module */
module.exports = {
  root: true,
  extends: '@react-native',
  requireConfigFile: false,
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    node: true,
  },
  rules: {
    // Maximum line length of 300 characters
    'max-len': ['error', { code: 300 }],
    // Detect unused styles in React Native
    'react-native/no-unused-styles': 'warn',
    // Enforce platform-specific components
    'react-native/split-platform-components': 'error',
    // Warn against inline styles
    'react-native/no-inline-styles': 'warn',
    // Warn against color literals
    'react-native/no-color-literals': 'warn',
    // Warn against raw text (except in <Text> components)
    'react-native/no-raw-text': ['warn', { skip: ['Text'] }],
    // Prevent style arrays with a single element
    'react-native/no-single-element-style-arrays': 'error',
    // Warn against console statements
    'no-console': 'warn',
    // Warn about unused variables
    'no-unused-vars': 'warn',
    // Enforce Rules of Hooks
    'react-hooks/rules-of-hooks': 'error',
    // Warn about missing dependencies in useEffect and similar hooks
    'react-hooks/exhaustive-deps': 'warn',
    // Allow JSX in .js files
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
        
    // Allow using styles before they are defined
    "no-use-before-define": ["error", { "variables": false }],

    "react/prop-types": "off"
  },
};
