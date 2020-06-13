# setup-polly-jest

## Overview

This helper provides a convenient way to use [PollyJS][] (HTTP recording,
replaying and stubbing tool) in your Jest/Jasmine tests.

## Installation

This library has a peer dependency on `@pollyjs/core`. That means that you will
need to install it separately if you don't have it installed yet.

```sh
npm install --save-dev setup-polly-jest @pollyjs/core
```

## Usage

This helper behaves almost the same way as built-in [Mocha][] or [QUnit][]
helpers for [PollyJS][]. If you used them before, this API should be familiar to
you:

```js
import { setupPolly } from 'setup-polly-jest';

describe('google.com', () => {
  let context = setupPolly({
    /* default configuration options */
  });

  test('should be able to search', async () => {
    /**
     * The `setupPolly` test helper creates a new polly instance which you can
     * access via `context.polly`. The recording name is generated based on
     * the suite (module) and spec (test) names.
     */
    context.polly.configure({ recordIfMissing: true });

    /* start: pseudo test code */

    await visit('/');

    await fillIn('#search', 'Awesome HTTP stubbing');

    await submit();

    expect(document.getElementById('search-result').textContent).toBe(
      'PollyJS'
    );

    /* end: pseudo test code */

    /**
     * The setupPolly test helper will call `context.polly.stop()` when your test
     * has finished.
     */
  });
});
```

To learn more about how to use PollyJS or what can you do with polly instance,
please refer to [PollyJS docs][polly-docs].

For real-world examples, check out ["Jest + Node Fetch"][jest-node-fetch] or
["Jest + Puppeteer"][jest-puppeteer] examples in PollyJS docs or
[tests](jest/index.test.js) in this repo

## Test Hook Ordering

Accessing `context.polly` during a test run before the instance of Polly has
been created or cleaned up produces the following error:

!> You are trying to access an instance of Polly that is not available.

If you need to do some work before the test run, you can access the instance of
Polly in `beforeEach` hook. If you need to do some work before the instance of
Polly gets cleaned up and removed, you can do so in `afterEach` hook.

```js
describe('test', () => {
  const context = setupPolly();

  beforeEach(() => {
    const { server } = context.polly;
    server.get('/ping').intercept((req, res) => res.sendStatus(200));
  });

  it('does a thing', async () => {
    expect(await fetch('/ping').status).toBe(200);
  });
});
```

## Caveats

Although this library is thoroughly covered with unit and intergration tests,
its implementation depends upon overwriting Jasmine environment. That means that
some _major_ changes in how Jest or Jasmine run tests can lead to this library
not working properly anymore.

## Contributing

If you stumbled upon any bugs 🐞, have a feature 🚀 in mind or you think that
documentation 📝 is lacking in any way, please, feel free to [open an
issue][issue] or submit a [pull-request][pr].

## LICENCE

[ISC](LICENSE)

[pollyjs]: https://netflix.github.io/pollyjs/
[mocha]: https://netflix.github.io/pollyjs/#/test-frameworks/mocha
[qunit]: https://netflix.github.io/pollyjs/#/test-frameworks/qunit
[polly-docs]: https://netflix.github.io/pollyjs/#/README
[jest-node-fetch]:
  https://netflix.github.io/pollyjs/#/examples?id=jest-node-fetch
[jest-puppeteer]: https://netflix.github.io/pollyjs/#/examples?id=jest-puppeteer
[issue]: https://github.com/gribnoysup/setup-polly-jest/issues
[pr]: https://github.com/gribnoysup/setup-polly-jest/pulls
