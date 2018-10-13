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

setupPolly({
  adapters: [FetchAdapter],
  persister: FSPersister,
  persisterOptions: {
    fs: {
      recordingsDir: path.resolve(__dirname, '__recordings__')
    }
  }
});

it.only('setup polly should work with `it.only`', async () => {
  expect(await getPost(3)).toHaveProperty('id', 3);
});
