# setup-polly-jest

## Overview

`setup-polly-jest` helps you setup Polly in jest/jasmine test environments.

`setup-polly-jest` is a helper method which after being called will set up new
[PollyJS][] instance before each test case.

This helper behaves almost the same way as built-in [Mocha][] or [QUnit][]
helpers for [PollyJS][]. There are a couple of differences though:

- As jest tests usually use arrow functions and in general using `this` in jest
  tests is not a common thing, this library will return context with polly as a
  property set to it instead of setting polly as a property on the `this`
  context
- `beforeEach` hook that creates new polly instance will always be the first in
  the chain of test case hooks
- `afterEach` hook that stops polly and removes polly from the context will
  always be the last in the chain of test case hooks

## Installation

This library has a peer dependency on `@pollyjs/core`

```sh
npm install --save-dev @pollyjs/core setup-polly-jest
```

## Usage

```js
// index.test.js

import FSPersister from '@pollyjs/persister-fs';
import FetchAdapter from '@pollyjs/adapter-fetch';

import { setupPolly } from 'setup-polly-jest';

const context = setupPolly({
  adapters: [FetchAdapter],
  persister: FSPersister,
  persisterOptions: {
    fs: {
      recordingsDir: '__recordings__'
    }
  }
});

describe('test with polly', () => {
  it('should init polly and proxy the request with it', async () => {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/posts/1'
    );

    expect(await response.json()).toHaveProperty('id', 1);
  });

  it('should configure polly to record failed requests', async () => {
    context.polly.configure({ recordFailedRequests: true });

    const response = await fetch(
      'https://jsonplaceholder.typicode.com/posts/99999'
    );

    expect(response).toHaveProperty('ok', false);
    expect(response).toHaveProperty('status', 404);
  });
});
```

> ℹ️&nbsp;&nbsp;For real-world example, check out
> [tests](__tests__/index.test.js) in this repo

## LICENCE

[ISC](LICENSE)

[pollyjs]: https://netflix.github.io/pollyjs/
[mocha]: https://netflix.github.io/pollyjs/#/test-frameworks/mocha
[qunit]: https://netflix.github.io/pollyjs/#/test-frameworks/qunit
