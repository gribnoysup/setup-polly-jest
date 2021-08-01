/**
 * @jest-environment jest-environment-node
 */
import { describe, it, expect } from '@jest/globals';
import { setupPolly } from '../../..';

// NB: Can't really test it in jasmine env as this would require nuking jasmine
// on the global scope
describe('setupPolly in unsupported environment', () => {
  it('throws when called', () => {
    expect(() => setupPolly()).toThrow();
  });
});
