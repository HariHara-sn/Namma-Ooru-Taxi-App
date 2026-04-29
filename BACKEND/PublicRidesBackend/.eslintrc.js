module.exports = {
  "parser": "@babel/eslint-parser",
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "ignorePatterns": ["cypress/","cypress.config.js", "/fareEngine"],
  "rules": {
    "indent": ["error", 4], // Enforce tab indentation
    "semi": "off", // Make semicolons optional
    "no-var": "error", // Disallow var, encourage let/const
    "eqeqeq": ["error", "always"],
    "no-console": "warn",
    "no-multi-spaces": "error",
    "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
    "comma-spacing": ["error", { "before": false, "after": true }],
    "camelcase": ["error", { "properties": "always" }],
    "prefer-const": ["error", { "destructuring": "all", "ignoreReadBeforeAssign": true }],
    "arrow-spacing": ["error", { "before": true, "after": true }]
  }
};

