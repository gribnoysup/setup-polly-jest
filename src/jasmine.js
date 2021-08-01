// @ts-check
import { Polly } from '@pollyjs/core';
import { JestPollyGlobals, createPollyContextAccessor } from './common';

/**
 * @typedef {import('@pollyjs/core').PollyConfig} PollyConfig
 * @typedef {import('jest-jasmine2').Jasmine} Jasmine
 * @typedef {InstanceType<Jasmine['Suite']>} JasmineSuite
 * @typedef {InstanceType<Jasmine['Spec']>} JasmineSpec
 * @typedef {InstanceType<Jasmine['Env']>} JasmineEnv
 * @typedef {JasmineEnv['it']} TestFn
 */

/**
 * Get full spec description, starting from the top suite
 *
 * @param {JasmineSpec} spec Current spec
 * @param {JasmineSuite} suite Current spec parent suite
 * @param {JasmineSuite} topSuite Top suite
 *
 * @returns {string} Full spec description (e.g. "suite/should do something")
 */
function getRecordingName(spec, suite, topSuite) {
  const descriptions = [spec.description];

  while (suite) {
    // In jest top suite description is empty, in jasmine it is a randomly
    // generated string. We don't want it to be used as recording name if it
    // exists
    if (suite.description && suite !== topSuite) {
      descriptions.push(suite.description);
    }
    suite = suite.parentSuite;
  }

  return descriptions.reverse().join('/');
}

/**
 * Recursively go through suite and its children and return the first that
 * matches the findFn condition
 *
 * @param {JasmineSuite} suite Starting point
 * @param {(suite: JasmineSuite) => boolean} findFn Find function
 *
 * @returns {JasmineSuite | null} Matching suite or null
 */
function findSuiteRec(suite, findFn) {
  if (findFn(suite)) return suite;

  let result = null;

  for (let i = 0, len = suite.children.length; i < len; i++) {
    const child = suite.children[i];
    // Only Suite has "children" property
    if (Object.prototype.hasOwnProperty.call(child, 'children')) {
      result = findSuiteRec(/** @type {JasmineSuite} */ (child), findFn);
    }
    if (result !== null) {
      return result;
    }
  }

  return result;
}

/**
 * Create proxy for jasmine test function that starts and
 * stops Polly on before/after hooks
 *
 * @param {typeof Polly} PollyConstructor Polly constructor
 * @param {TestFn} fn Original test runner test function
 * @param {JasmineEnv} jasmineEnv Jasmine environment
 * @param {?} ctx Global context
 *
 * @returns {TestFn} Proxy function
 */
function createTestFnProxy(PollyConstructor, fn, jasmineEnv, ctx) {
  const globals = new JestPollyGlobals(ctx);

  return function testFn() {
    /**
     * @type {JasmineSpec}
     */
    const spec = fn.apply(jasmineEnv, arguments);
    const specHooks = spec.beforeAndAfterFns;

    let pollyError;

    spec.beforeAndAfterFns = function beforeAndAfterFns() {
      /**
       * @type {ReturnType<typeof specHooks>}
       */
      const { befores, afters } = specHooks.apply(spec, arguments);

      /**
       * NB: Using `done` and `done.fail` so that we support jasmine2 that
       * doesn't handle returned promises in before/after and also passing
       * `error` to `done` in some versions
       * 
       * @type {JasmineSpec['queueableFn']['fn']} done
       */
      const before = function before(done) {
        try {
          if (globals.isPollyActive) {
            const topSuite = jasmineEnv.topSuite();
            const specParentSuite = findSuiteRec(topSuite, suite =>
              (suite.children || []).some(child => child.id === spec.id)
            );

            let recordingName = getRecordingName(
              spec,
              specParentSuite,
              topSuite
            );

            globals.pollyContext.polly = new PollyConstructor(
              recordingName,
              globals.pollyContext.options
            );
          }

          done();
        } catch (error) {
          // If we caught instance of the polly error, we will save it for the
          // reference and continue with the tests to print the error at the end
          // of the spec where it's more visible
          if (error.name === 'PollyError') {
            pollyError = error;
            done();
          } else {
            // Otherwise let's just fail spec, there is nothing special we can
            // do in that case
            done.fail(error);
          }
        }
      };

      /**
       * NB: Using `done` and `done.fail` so that we support jasmine2 that
       * doesn't handle returned promises in before/after and also passing
       * `error` to `done` in some versions
       * 
       * @type {JasmineSpec['queueableFn']['fn']} done
       */
      const after = function after(done) {
        try {
          // We want to throw polly error here so it's shown as the last one in the
          // list of possible errors that happend during the test run
          if (pollyError) {
            pollyError.message =
              pollyError.message.replace(/\.$/, '') +
              ". Check `setupPolly` method and make sure it's configured correctly.";

            throw pollyError;
          }

          if (globals.pollyContext.polly) {
            globals.pollyContext.polly.stop().then(() => {
              globals.pollyContext.polly = null;
              done();
            });
          } else {
            done();
          }
        } catch (error) {
          done.fail(error);
        }
      };

      return {
        befores: [{ fn: before }, ...befores],
        afters: [...afters, { fn: after }]
      };
    };

    return spec;
  };
}

/**
 * Attach test fn proxies to jasmine environment if needed and
 * add beforeAll/afterAll hooks that will activate/deactivate
 * Polly when running test suite
 *
 * @param {PollyConfig} defaults Polly default options
 * @param {typeof Polly} PollyConstructor Polly constructor
 * @param {?} ctx Global context
 *
 * @returns {ReturnType<typeof createPollyContextAccessor>} Context with `polly` property
 */
export function setupPollyJasmine(
  defaults = {},
  PollyConstructor = Polly,
  ctx = global
) {
  const globals = new JestPollyGlobals(ctx);

  if (!globals.isJasmineEnvironment) {
    return null;
  }

  /**
   * @type {JasmineEnv}
   */
  const jasmineEnv = ctx.jasmine.getEnv();

  if (!globals.isPollyAttached) {
    jasmineEnv.it = createTestFnProxy(
      PollyConstructor,
      jasmineEnv.it,
      jasmineEnv,
      ctx
    );
    jasmineEnv.fit = createTestFnProxy(
      PollyConstructor,
      jasmineEnv.fit,
      jasmineEnv,
      ctx
    );

    globals.isPollyAttached = true;
    globals.isPollyActive = false;
  }

  ctx.beforeAll(() => {
    globals.pollyContext.options = defaults;
    globals.isPollyActive = true;
  });

  ctx.afterAll(() => {
    globals.pollyContext.options = null;
    globals.isPollyActive = false;
  });

  return createPollyContextAccessor(globals);
}
