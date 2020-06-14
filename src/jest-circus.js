// @ts-check
import { beforeAll, afterAll } from '@jest/globals';
import { JestPollyGlobals, createPollyContextAccessor } from './common';

/**
 * @typedef {import('@pollyjs/core').PollyConfig} PollyConfig
 */

/**
 * @param {PollyConfig} defaults
 * @param {unknown | undefined} ctx
 *
 * @returns {ReturnType<typeof createPollyContextAccessor>}
 */
export function setupPollyJestCircus(defaults = {}, ctx) {
  const globals = new JestPollyGlobals(ctx);

  if (!globals.isJestPollyEnvironment) {
    return;
  }

  beforeAll(() => {
    globals.isPollyActive = true;
    globals.pollyContext.options = defaults;
  });

  afterAll(() => {
    globals.isPollyActive = false;
    globals.pollyContext.options = null;
  });

  return createPollyContextAccessor(globals);
}
