const { JestPollyGlobals, formatMessage } = require('./lib/common');

/**
 * @typedef {import('@pollyjs/core').PollyConfig} PollyConfig
 * @typedef {import('@pollyjs/core').Polly} Polly
 * @typedef {{ polly: Polly }} PollyJestContext
 */

/**
 * @type {{ setupPolly(config: PollyConfig): PollyJestContext }}
 */
const pollyJest = Object.assign(
  {
    setupPolly(options) {
      const globals = new JestPollyGlobals();

      try {
        if (globals.isJasmineEnvironment) {
          const { setupPollyJasmine } = require('./lib/jasmine');
          return setupPollyJasmine(options);
        } else if (globals.isJestPollyEnvironment) {
          const { setupPollyJestCircus } = require('./lib/jest-circus');
          return setupPollyJestCircus(options);
        }
      } catch (e) {
        // @jest/environment used in ./lib/jest-circus might throw when imported
        // outside of Jest test environment. This is definitely not a supported
        // behavior, but we want a meaningful error instead of the default one
      }

      const message = formatMessage(`
        Seems like you are trying to use "setupPolly" outside of supported jest
        or jasmine environment.

        If you are using setup-polly-jest with jest <= 26 or with jasmine, check
        that you are calling the method inside your test environment.

        If you are using setup-polly-jest with jest >= 27 or jest-circus runner
        with older versions of jest, check that you are setting correct
        environment for the test:

        /** @jest-environment setup-polly-jest/jest-environment-node */
        
        See: https://netflix.github.io/pollyjs/#/test-frameworks/jest-jasmine?id=supported-test-runners
      `);

      throw new Error(message);
    }
  },
  process.env.NODE_ENV === 'test' && { JestPollyGlobals }
);

module.exports = pollyJest;
