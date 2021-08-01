/** @jest-environment ../../../jest-environment-node */

const path = require('path');
const { setupPolly } = require('../../..');
const { getPost } = require('../../getPost');

describe('xit', () => {
  setupPolly({
    adapters: [require('@pollyjs/adapter-node-http')],
    persister: require('@pollyjs/persister-fs'),
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '__recordings__')
      }
    }
  });

  it('should run test before `xit` and not fail', async () => {
    const post = await getPost(1);
    expect(post.id).toBe(1);
  });

  xit('skipped', async () => {
    const post = await getPost(2);
    expect(post.id).toBe(2);
  });

  it('should run test after `xit` and not fail', async () => {
    const post = await getPost(3);
    expect(post.id).toBe(3);
  });
});
