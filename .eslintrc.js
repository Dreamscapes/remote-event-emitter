'use strict'

module.exports = {
  parser: 'babel-eslint',

  extends: [
    '@strv/javascript/environments/nodejs/v10',
    '@strv/javascript/environments/nodejs/optional',
    '@strv/javascript/environments/mocha/recommended',
    '@strv/javascript/coding-styles/recommended',
  ],

  rules: {
    // If your editor cannot show these to you, occasionally turn this off and run the linter
    'no-warning-comments': 0,

    'node/no-unsupported-features/es-syntax': ['error', {
      ignores: ['modules'],
    }],
  },

  overrides: [{
    files: [
      '**/*.test.mjs',
    ],

    env: {
      mocha: true,
    },

    globals: {
      expect: true,
      sinon: true,
    },

    rules: {
      'max-nested-callbacks': [1, 7],
    }
  }],
}
