'use strict'

module.exports = {
  extends: [
    '@strv/commitlint-config',
  ],

  rules: {
    'scope-enum': [2, 'always', [
      'provider',
      'consumer',
    ]],
  },
}
