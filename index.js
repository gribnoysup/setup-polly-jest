const { Polly } = require('@pollyjs/core');

const { setupPolly: setup } = require('./lib/setup');

module.exports = {
  setupPolly(options, jasmine, context) {
    return setup(Polly, options, jasmine, context);
  },
};
