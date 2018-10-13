/* global jasmine */
const { default: fetch, Request, Response, Headers } = require('node-fetch');

// Give polly fetch adapter access to node-fetch
// implementation
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

const getPost = async id => {
  const response = await global.fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );

  const json = await response.json();

  return Object.assign(json, { ok: response.ok, status: response.status });
};

const { setupPolly, IS_POLLY_ACTIVE, IS_POLLY_ATTACHED } = require('../');

describe('setupPolly', () => {
  const context = setupPolly({
    adapters: [require('@pollyjs/adapter-fetch')],
    persister: require('@pollyjs/persister-fs'),
    persisterOptions: {
      fs: {
        recordingsDir: require('path').resolve(__dirname, '__recordings__')
      }
    },
    adapterOptions: {
      fetch: {
        context: global
      }
    }
  });

  it('should have polly active', () => {
    const jasmineEnv = jasmine.getEnv();

    expect(jasmineEnv[IS_POLLY_ATTACHED]).toBe(true);
    expect(jasmineEnv[IS_POLLY_ACTIVE]).toBe(true);
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
    const jasmineEnv = jasmine.getEnv();

    expect(jasmineEnv[IS_POLLY_ACTIVE]).toBe(false);
  });
});
