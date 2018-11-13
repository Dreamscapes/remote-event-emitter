'use strict'

module.exports = {
  extends: [
    '@commitlint/config-conventional',
  ],

  rules: {
    'scope-enum': [2, 'always', [
      'provider',
      'consumer',
    ]],

    'body-leading-blank': [2, 'always'],
  },
}
