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

export const IS_POLLY_SET_UP = Symbol('IS_POLLY_SET_UP');

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
 * // For a real world example, check out README or tests in
 * // this repo
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
  const testOnly = jasmineEnv.fit;

  if (
    jasmineEnv.it[IS_POLLY_SET_UP] === true ||
    jasmineEnv.fit[IS_POLLY_SET_UP] === true
  ) {
    throw new Error(
      'Seems like polly is set up already. ' +
        'Please, call context.clearPolly to unset polly before setting it up again'
    );
  }

  // Factory that will create test function
  // to proxy original test functions from
  // jasmine env
  const createTestFn = testFn => (...args) => {
    const testCase = testFn.apply(jasmineEnv, args);
    const hooks = testCase.beforeAndAfterFns;

    // Overwrite `beforeAndAfterFns` to add additional before/after hooks
    // to all tests
    testCase.beforeAndAfterFns = (...args) => {
      const { befores, afters } = hooks.apply(testCase, args);

      const before = done => {
        polly = new Polly(testCase.getFullName(), options);
        done && done();
      };

      const after = async done => {
        // As the clearPolly method can be called at this point
        // we need to check if polly is still there
        if (polly && typeof polly.stop === 'function') {
          await polly.stop();
          polly = null;
        }

        done && done();
      };

      return {
        // Before hook will be the first one to execute
        befores: [{ fn: before }].concat(befores),
        // After hook will always be the last one
        afters: afters.concat({ fn: after })
      };
    };

    return testCase;
  };

  jasmineEnv.it = createTestFn(test);
  jasmineEnv.it[IS_POLLY_SET_UP] = true;

  jasmineEnv.fit = createTestFn(testOnly);
  jasmineEnv.fit[IS_POLLY_SET_UP] = true;

  const clearPolly = async done => {
    if (polly && typeof polly.stop === 'function') {
      await polly.stop();
      polly = null;
    }

    jasmineEnv.it = test;
    jasmineEnv.fit = testOnly;

    done && done();
  };

  if (context && typeof context.afterAll === 'function') {
    context.afterAll(clearPolly);
  }

  return {
    get polly() {
      return polly;
    },
    clearPolly
  };
};
