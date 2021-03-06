'use strict'

module.exports = {
  // Options for mocha-reporter-remote
  // Other reporters will ignore these options.
  reporterOption: [
    `root=${__dirname}`,
    'nostats=1',
  ],
  colors: true,
  checkLeaks: true,
  require: [
    'source-map-support/register',
    'test/bootstrap',
  ],
  exclude: [
    '**/node_modules/**',
  ],
  spec: ['test', '**/*.test.js'],
}
