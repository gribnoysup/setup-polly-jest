export const IS_POLLY_ACTIVE = Symbol('IS_POLLY_ACTIVE');

export const IS_POLLY_ATTACHED = Symbol('IS_POLLY_ATTACHED');

const pollyContext = {
  polly: null,
  pollyOptions: {}
};

const getRecordingName = (spec, suite) => {
  const descriptions = [spec.description];

  while (suite) {
    suite.description && descriptions.push(suite.description);
    suite = suite.parentSuite;
  }

  return descriptions.reverse().join('/');
};

/**
 * Recursively go through suite and its children
 * and return the first that matches the findFn
 * condition
 *
 * @param {Object} suite Starting point
 * @param {Function} findFn Find function
 *
 * @returns {?Object} Matching suite or null
 */
const findSuiteRec = (suite, findFn) => {
  if (findFn(suite)) return suite;

  for (const child of suite.children || []) {
    const result = findSuiteRec(child, findFn);

    if (result !== null) {
      return result;
    }
  }

  return null;
};

const createTestFnProxy = (testFn, Polly, jasmineEnv) => (...args) => {
  const spec = testFn.apply(jasmineEnv, args);
  const specHooks = spec.beforeAndAfterFns;

  spec.beforeAndAfterFns = (...args) => {
    const { befores, afters } = specHooks.apply(spec, args);

    const before = done => {
      if (jasmineEnv[IS_POLLY_ACTIVE]) {
        const topSuite = jasmineEnv.topSuite();
        const specParentSuite = findSuiteRec(topSuite, suite =>
          (suite.children || []).some(child => child.id === spec.id)
        );

        const recordingName = getRecordingName(spec, specParentSuite).replace(
          `${topSuite.description}/`,
          ''
        );

        pollyContext.polly = new Polly(
          recordingName,
          pollyContext.pollyOptions
        );
      }

      done && done();
    };

    const after = async done => {
      if (pollyContext.polly) {
        await pollyContext.polly.stop();
        pollyContext.polly = null;
      }

      done && done();
    };

    return {
      befores: [{ fn: before }, ...befores],
      afters: [...afters, { fn: after }]
    };
  };

  return spec;
};

export const setupJasmine = (
  Polly,
  pollyOptions = {},
  jasmineContext = global.jasmine,
  globalContext = global
) => {
  if (
    !jasmineContext ||
    (jasmineContext && typeof jasmineContext.getEnv !== 'function')
  ) {
    throw new TypeError(
      'Couldn\'t find jasmine environment. Make sure that you are using "setupJasmine" in ' +
        'jasmine/jest environment or that you provided proper jasmine environment when calling "setupJasmine"'
    );
  }

  const jasmineEnv = jasmineContext.getEnv();

  pollyContext.pollyOptions = pollyOptions;

  const clearPolly = async done => {
    if (pollyContext.polly) {
      await pollyContext.polly.stop();
      pollyContext.polly = null;
    }

    jasmineEnv[IS_POLLY_ACTIVE] = false;

    done && done();
  };

  if (!jasmineEnv[IS_POLLY_ATTACHED]) {
    jasmineEnv.it = createTestFnProxy(jasmineEnv.it, Polly, jasmineEnv);
    jasmineEnv.fit = createTestFnProxy(jasmineEnv.fit, Polly, jasmineEnv);

    jasmineEnv[IS_POLLY_ATTACHED] = true;
    jasmineEnv[IS_POLLY_ACTIVE] = false;
  }

  globalContext.beforeAll(() => {
    jasmineEnv[IS_POLLY_ACTIVE] = true;
  });

  globalContext.afterAll(clearPolly);

  return {
    get polly() {
      return pollyContext.polly;
    },
    clearPolly
  };
};
