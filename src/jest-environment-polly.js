// @ts-check
import { Polly } from '@pollyjs/core';
import { JestPollyGlobals } from './common';

/**
 * @typedef {import("@jest/types").Circus.Event} CircusEvent
 * @typedef {import("@jest/types").Circus.State} CircusState
 * @typedef {import("@jest/types").Circus.TestEntry} CircusTestEntry
 * @typedef {import("@jest/types").Circus.DescribeBlock} CircusDescribeBlock
 * @typedef {import("@jest/environment")['JestEnvironment']} JestEnvironment
 * @typedef {import('@pollyjs/core').PollyConfig} PollyConfig
 */

/**
 * Returns test name including all parents
 *
 * @param {CircusTestEntry} test
 * @param {CircusDescribeBlock} rootDescribeBlock
 *
 * @returns {string}
 */
function getRecordingName(test, rootDescribeBlock) {
  const name = [test.name];
  /**
   * @type {CircusDescribeBlock | undefined}
   */
  let parent = test.parent;

  while (parent) {
    // Root describe block name is constant, no point in including it in the
    // recording name
    if (parent.name && parent !== rootDescribeBlock) {
      name.push(parent.name);
    }
    parent = parent.parent;
  }

  return name.reverse().join('/');
}

/**
 * Returns jest environment compatible PollyEnvironment that activates Polly
 * when test starts and stops it after test finishes
 *
 * @param {JestEnvironment} JestEnvironment
 * @param {typeof Polly} PollyConstructor
 *
 * @returns {JestEnvironment}
 */
export function PollyEnvironmentFactory(
  JestEnvironment,
  PollyConstructor = Polly
) {
  return class PollyEnvironment extends JestEnvironment {
    async setup() {
      await super.setup();
      this.pollyGlobals = new JestPollyGlobals(this.global);
      this.pollyGlobals.isJestPollyEnvironment = true;
    }

    /**
     * @param {CircusEvent} event
     * @param {CircusState} state
     */
    // TS types demand that this is an instance property, not a prototype method
    // @ts-expect-error
    async handleTestEvent(event, state) {
      if (super.handleTestEvent) {
        // TS is confused because we are explicitly awaiting (to cover both
        // sync and async handlers) but it really wants us to handle only one
        // of those
        // @ts-expect-error
        await super.handleTestEvent(event, state);
      }

      // Start Polly instance at the beginning of the test run (before hooks) if
      // Polly is active (setupPolly was called in this describe block)
      if (event.name === 'test_start' && this.pollyGlobals.isPollyActive) {
        const recordingName = getRecordingName(
          event.test,
          state.rootDescribeBlock
        );
        this.pollyGlobals.pollyContext.polly = new PollyConstructor(
          recordingName,
          this.pollyGlobals.pollyContext.options
        );
      }

      // Stop Polly instance if there is one running. We check `skip` in
      // addition to done because specs emit `test_start` even when they will be
      // then skipped
      if (
        ['test_done', 'test_skip'].includes(event.name) &&
        this.pollyGlobals.pollyContext.polly
      ) {
        await this.pollyGlobals.pollyContext.polly.stop();
        this.pollyGlobals.pollyContext.polly = null;
      }
    }
  };
}
