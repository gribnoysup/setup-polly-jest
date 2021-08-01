/** @jest-environment ../../../jest-environment-node */

const path = require('path');
const { setupPolly } = require('../../..');
const { getPost } = require('../../getPost');

describe('it.skip', () => {
  setupPolly({
    adapters: [require('@pollyjs/adapter-node-http')],
    persister: require('@pollyjs/persister-fs'),
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '__recordings__')
      }
    }
  });

  it('should run test before .skip and not fail', async () => {
    expect(await getPost(1)).toHaveProperty('id', 1);
  });

  it.skip('skipped', async () => {
    expect(await getPost(2)).toHaveProperty('id', 2);
  });

  it('should run test after .skip and not fail', async () => {
    expect(await getPost(3)).toHaveProperty('id', 3);
  });
});
