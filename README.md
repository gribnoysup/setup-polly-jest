# setup-polly-jest

`setup-polly-jest` is a helper method which after being called will set up new
[PollyJS][] instance before each test case.

This helper behaves almost the same way as built-in [Mocha][] or [QUnit][]
helpers for [PollyJS][]

[pollyjs]: https://netflix.github.io/pollyjs/
[mocha]: https://netflix.github.io/pollyjs/#/test-frameworks/mocha
[qunit]: https://netflix.github.io/pollyjs/#/test-frameworks/qunit

## Installation

This library has a peer dependency on `@pollyjs/core`

```sh
npm install --save-dev @pollyjs/core @gribnoysup/setup-polly-jest
```

## Usage

```js
// index.test.js

import FSPersister from '@pollyjs/persister-fs';
import FetchAdapter from '@pollyjs/adapter-fetch';

import { setupPolly } from '@gribnoysup/setup-polly-jest';

const context = setupPolly({
  adapters: [FetchAdapter],
  persister: FSPersister,
  persisterOptions: {
    fs: {
      recordingsDir: '__recordings__',
    },
  },
});

describe('test with polly', () => {
  it('should init polly and proxy the request with it', async () => {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/posts/1'
    );

    expect(await response.json()).toHaveProperty('id', 1);
  });
});
```

> ℹ️&nbsp;&nbsp;For real-world example, check out
> [tests](__tests__/index.test.js) in this repo

## LICENCE

[ISC](LICENSE)
