const getJasmineEnv = jasmine => {
  if (jasmine && typeof jasmine.getEnv === 'function') {
    return jasmine.getEnv();
  }

  throw new Error(
    "Couldn't find jasmine environment. " +
      'Make sure that you are using `setupPolly` in jasmine/jest environment ' +
      'or that you provided proper jasmine environment when calling setupPolly'
  );
};

const POLLY_SET_UP = Symbol();

/**
 * Sets up Polly to work with jest/jasmine test environments.
 *
 * After calling setupPolly, it will setup test runner proxy that
 * will create new polly instance before each test and stop it
 * after each test, persisting all records.
 *
 * setupPolly returns context that can give user access to polly
 * instance for additional configuration. There is also a `clearPolly`
 * method that allows user to remove `it` proxy at any time.
 *
 * @example
 *
 * // For a real world example, check out tests in this repo
 *
 * const { setupPolly } = require('setup-polly-jest');
 *
 * const context = setupPolly({
 *   adapters: ['fetch'],
 *   persister: 'fs',
 *   persisterOptions: {
 *     fs: {
 *       recordingsDir: '__recordings__',
 *     },
 *   },
 * });
 *
 * describe('test with polly', () => {
 *   it('should init polly and proxy the request with it', async () => {
 *     const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
 *     expect(await response.json()).toHaveProperty('id', 1);
 *   })
 * })
 *
 * @param {Polly} Polly Polly constructor
 * @param {Object} options Polly options
 * @param {Object} jasmine Jasmine context
 * @param {Object} context Global context
 *
 * @returns {Object} Context that gives users access to polly instance
 */
export const setupPolly = (
  Polly,
  options = {},
  jasmine = global.jasmine,
  context = global
) => {
  let polly = null;

  const jasmineEnv = getJasmineEnv(jasmine);
  const test = jasmineEnv.it;

  if (jasmineEnv.it[POLLY_SET_UP] === true) {
    throw new Error(
      'Seems like polly is set up already. ' +
        'Please, call context.clearPolly to unset polly before setting it up again'
    );
  }

  // Overwrite `it` method to get access to test name
  jasmineEnv.it = function it() {
    const testCase = test.apply(jasmineEnv, arguments);
    const hooks = testCase.beforeAndAfterFns;

    // Overwrite `beforeAndAfterFns` to add additional before/after hooks
    // to all tests
    testCase.beforeAndAfterFns = function beforeAndAfterFns() {
      const { befores, afters } = hooks.apply(testCase, arguments);

      const before = function before(done) {
        polly = new Polly(testCase.getFullName(), options);
        done();
      };

      const after = async function after(done) {
        await polly.stop();
        polly = null;
        done();
      };

      return {
        // Before hook will be the first one to execute
        befores: [{ fn: before }].concat(befores),
        // After hook will always be the last one
        afters: afters.concat({ fn: after }),
      };
    };

    return testCase;
  };

  jasmineEnv.it[POLLY_SET_UP] = true;

  const clearPolly = () => {
    polly = null;
    jasmineEnv.it = test;
  };

  if (context && typeof context.afterAll === 'function') {
    context.afterAll(clearPolly);
  }

  return {
    get polly() {
      return polly;
    },
    clearPolly,
  };
};
