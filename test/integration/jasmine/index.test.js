const { setupPolly, JestPollyGlobals } = require('../../..');
const { getPost } = require('../../getPost');

const globals = new JestPollyGlobals();

describe('setupPolly', () => {
  const context = setupPolly({
    adapters: [require('@pollyjs/adapter-node-http')],
    persister: require('@pollyjs/persister-fs'),
    persisterOptions: {
      fs: {
        recordingsDir: require('path').resolve(__dirname, '__recordings__')
      }
    }
  });

  it('should have polly active', () => {
    expect(globals.isPollyAttached).toBe(true);
    expect(globals.isPollyActive).toBe(true);
  });

  it('should have polly running with `test`', async () => {
    const post = await getPost(1);

    expect(post.id).toBe(1);
  });

  it('should configure polly when needed', async () => {
    context.polly.configure({ recordFailedRequests: true });

    const response = await getPost(-999999);

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});

describe('another describe', () => {
  it('should not have polly active', () => {
    expect(globals.isPollyActive).toBe(false);
  });
});
