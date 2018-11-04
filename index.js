const { Polly } = require('@pollyjs/core');

const { default: setupJasmine } = require('./lib/setupJasmine');

module.exports = Object.assign(
  {
    setupPolly(options) {
      return setupJasmine(Polly, options);
    }
  },
  process.env.NODE_ENV === 'test' && {
    IS_POLLY_ACTIVE: setupJasmine.IS_POLLY_ACTIVE,
    IS_POLLY_ATTACHED: setupJasmine.IS_POLLY_ATTACHED
  }
);
