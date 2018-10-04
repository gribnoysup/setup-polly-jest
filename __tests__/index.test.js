const path = require('path');
const fetch = require('node-fetch');

const FetchAdapter = require('@pollyjs/adapter-fetch');
const FSPersister = require('@pollyjs/persister-fs');

const { setupPolly } = require('../');

const getPost = async id => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );

  const json = await response.json();

  return Object.assign(json, { ok: response.ok, status: response.status });
};

const context = setupPolly({
  adapters: [FetchAdapter],
  persister: FSPersister,
  persisterOptions: {
    fs: {
      recordingsDir: path.resolve(__dirname, '../__recordings__'),
    },
  },
});

describe('polly jest integration', () => {
  test('should have polly running with `test`', async () => {
    expect(await getPost(1)).toHaveProperty('id', 1);
  });

  it('should have polly running with `it`', async () => {
    expect(await getPost(2)).toHaveProperty('id', 2);
  });

  it.each([1, 2, 3])(
    'should work with each, capturing recording for post #%i',
    async id => {
      expect(await getPost(id)).toHaveProperty('id', id);
    }
  );

  describe('deeply', () => {
    describe('nested', () => {
      describe('test case', () => {
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
});
