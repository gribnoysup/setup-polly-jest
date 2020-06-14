/**
 * @jest-environment jest-environment-node
 */
import { describe, it, expect } from '@jest/globals';
import { setupPolly } from '../..';

describe('setupPolly in unsupported environment', () => {
  it('throws when called', () => {
    expect(() => setupPolly()).toThrow();
  });
});
