const { Polly } = require('@pollyjs/core');

const { setupPolly: setup, IS_POLLY_SET_UP } = require('./lib/setup');

module.exports = Object.assign(
  {
    setupPolly(options, jasmine, context) {
      return setup(Polly, options, jasmine, context);
    }
  },
  // Export Symbol only for testing purposes
  process.env.NODE_ENV === 'test' && { IS_POLLY_SET_UP }
);
