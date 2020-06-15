// @ts-check
/**
 * @typedef {import("@pollyjs/core").Polly} Polly
 * @typedef {import("@pollyjs/core").PollyConfig} PollyConfig
 */

/** Flag, showing that Polly is active */
const isPollyActive = Symbol.for('isPollyActive');

/** Flag, showing that proxy test methods are attached */
const isPollyAttached = Symbol.for('isPollyAttached');

/** Flag to check that Polly environment was applied */
const isJestPollyEnvironment = Symbol.for('isJestPollyEnvironment');

/** Accessor for Polly context on the global scope */
const pollyContext = Symbol.for('pollyContext');

/**
 * @typedef {object} PollyContext
 * @property {Polly | null} polly
 * @property {PollyConfig | null} options
 */

export class JestPollyGlobals {
  /**
   * @param {?} ctx
   */
  constructor(ctx = global) {
    this.global = ctx;
    if (!this.pollyContext) {
      this.pollyContext = {
        polly: null,
        options: null
      };
    }
  }

  get isJasmineEnvironment() {
    return !!(
      this.global &&
      this.global.jasmine &&
      typeof this.global.jasmine.getEnv == 'function'
    );
  }

  get isPollyActive() {
    return this.global[isPollyActive];
  }

  /**
   * @param {boolean} val
   */
  set isPollyActive(val) {
    this.global[isPollyActive] = val;
  }

  get isPollyAttached() {
    return this.global[isPollyAttached];
  }

  /**
   * @param {boolean} val
   */
  set isPollyAttached(val) {
    this.global[isPollyAttached] = val;
  }

  get isJestPollyEnvironment() {
    return this.global[isJestPollyEnvironment];
  }

  /**
   * @param {boolean} val
   */
  set isJestPollyEnvironment(val) {
    this.global[isJestPollyEnvironment] = val;
  }

  get pollyContext() {
    return this.global[pollyContext];
  }

  /**
   * @param {PollyContext} val
   */
  set pollyContext(val) {
    this.global[pollyContext] = val;
  }
}

/**
 * A message can have a little formatting, as a treat
 *
 * Replaces one new line with a space, keeps two newlines intact treating
 * text kinda like a markdown paragraphs.
 *
 * @example
 *
 * const msg = formatMessage(`
 *   I can type a paragraph of text
 *   on multiple lines and this method
 *   will format it into one line.
 * `)
 *
 * msg === "I can type a paragraph of text on multiple lines and this method will format it into one line."
 *
 * @param {string} message
 *
 * @returns {string} Formatted message
 */
export function formatMessage(message) {
  return (
    message
      // Trim every line first so we know exactly where double+ newlines are
      .split(/\n/)
      .map(line => line.trim())
      .join('\n')
      // Split by double newlines ...
      .split(/\n{2,}/)
      // ... and join paragraphs into a single line of text
      .map(paragraph => paragraph.replace(/\n/g, ' '))
      // Join everything back with double newline
      .join('\n\n')
      .trim()
  );
}

/**
 * @param {JestPollyGlobals} globals
 */
export function createPollyContextAccessor(globals) {
  return {
    get polly() {
      if (globals.pollyContext.polly == null) {
        const message = `
          You are trying to access an instance of Polly that is not yet available.
          
          See: https://netflix.github.io/pollyjs/#/test-frameworks/jest-jasmine?id=test-hook-ordering
        `;

        throw new Error(formatMessage(message));
      }

      return globals.pollyContext.polly;
    }
  };
}
