/**
 * This test suite is used to manually test that setupPolly throws meaningful
 * error messages when Polly is misconfigured or context is used incorrectly
 */
const { setupPolly } = require('../..');

describe.skip('setupPolly with wrong config', () => {
  setupPolly({
    persister: 'this-will-throw'
  });

  it('should fail tests with meaningful message', () => {
    expect(1).toBeTruthy();
  });
});

describe.skip('trying to access polly outside of tests', () => {
  const context = setupPolly();

  context.polly.configure({
    recordIfMissing: true
  });

  it('should fail tests with meaningful message', () => {
    expect(true).toBeTruthy();
  });
});
