/** @jest-environment ../../../jest-environment-node */

const path = require('path');
const fetch = require('node-fetch');
const { setupPolly, JestPollyGlobals } = require('../../..');

const getPost = async id => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  const json = await response.json();
  return Object.assign(json, { ok: response.ok, status: response.status });
};

const globals = new JestPollyGlobals();

describe('setupPolly', () => {
  const context = setupPolly({
    adapters: [require('@pollyjs/adapter-node-http')],
    persister: require('@pollyjs/persister-fs'),
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '__recordings__')
      }
    }
  });

  it('should have polly active', () => {
    expect(globals.isPollyActive).toBe(true);
  });

  test('should have polly running with `test`', async () => {
    expect(await getPost(1)).toHaveProperty('id', 1);
  });

  it('should have polly running with `it`', async () => {
    expect(await getPost(2)).toHaveProperty('id', 2);
  });

  it.each([1, 2, 3])(
    'should work with each, capturing recording for post #%s',
    async id => {
      expect(await getPost(id)).toHaveProperty('id', id);
    }
  );

  describe('deeply', () => {
    describe('nested', () => {
      describe('test cases', () => {
        it('should work', async () => {
          expect(await getPost(3)).toHaveProperty('id', 3);
        });
      });
    });
  });

  it('should configure polly when needed', async () => {
    context.polly.configure({ recordFailedRequests: true });

    const response = await getPost(-999999);

    expect(response).toHaveProperty('ok', false);
    expect(response).toHaveProperty('status', 404);
  });

  describe('can access Polly in before and after each', () => {
    beforeEach(() => {
      context.polly.server
        .any('https://jsonplaceholder.typicode.com/posts/:id')
        .intercept((req, res) => {
          return res.json({
            id: Number(req.params.id),
            title: 'Hello, world!'
          });
        });
    });

    it('gets intercepted mocked response', async () => {
      const response = await getPost(999);

      expect(response).toHaveProperty('status', 200);
      expect(response).toHaveProperty('id', 999);
      expect(response).toHaveProperty('title', 'Hello, world!');
    });
  });

  describe('with skipped test', () => {
    it('should record', async () => {
      expect(await getPost(1)).toHaveProperty('id', 1);
    });

    it.skip('should not break the suite and should not record', async () => {
      expect(await getPost(2)).toHaveProperty('id', 2);
    });
  });
});

describe('another describe', () => {
  it('should not have polly active', () => {
    expect(globals.isPollyActive).toBeFalsy();
  });
});
