const fetch = require('node-fetch');

const getPost = async id => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  const json = await response.json();
  return Object.assign(json, { ok: response.ok, status: response.status });
};

module.exports = { getPost };
