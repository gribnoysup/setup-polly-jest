/** @jest-environment ../../../jest-environment-jsdom */

const path = require('path');
const { setupPolly } = require('../../..');
const { getPost } = require('../../getPost');

describe('it.only', () => {
  setupPolly({
    adapters: [require('@pollyjs/adapter-node-http')],
    persister: require('@pollyjs/persister-fs'),
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '__recordings__')
      }
    }
  });

  it('skipped test', () => {});

  it.only('setup polly should work with `it.only`', async () => {
    expect(await getPost(3)).toHaveProperty('id', 3);
  });

  it('another skipped test', () => {});
});
