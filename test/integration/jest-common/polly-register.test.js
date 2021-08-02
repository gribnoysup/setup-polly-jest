/** @jest-environment ../../../jest-environment-jsdom */

const path = require('path');
const { Polly } = require('@pollyjs/core');
const { setupPolly } = require('../../..');
const { getPost } = require('../../getPost');

Polly.register(require('@pollyjs/adapter-node-http'));
Polly.register(require('@pollyjs/persister-fs'));

// FIXME: see https://github.com/gribnoysup/setup-polly-jest/issues/23
const desc = !global.jasmine
  ? // eslint-disable-next-line no-console
    (console.warn('Skipping failing test suite in jest-circus'), describe.skip)
  : describe;

desc('Polly.register', () => {
  setupPolly({
    adapters: ['node-http'],
    persister: 'fs',
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '__recordings__')
      }
    }
  });

  it('setup-polly-jest works when adapters and persisters are registered with Polly.register', async () => {
    expect(await getPost(1)).toHaveProperty('id', 1);
  });
});
