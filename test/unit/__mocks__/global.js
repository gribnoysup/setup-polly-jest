export const beforeAndAfterFnsMock = jest.fn(() => ({
  befores: [],
  afters: []
}));

export const testMock = jest.fn(name => ({
  id: name,
  description: name,
  beforeAndAfterFns: beforeAndAfterFnsMock
}));

const createSuiteMock = (
  id,
  description,
  parentSuite = null,
  children = []
) => ({
  id,
  description,
  parentSuite,
  children
});

class JasmineMock {
  constructor() {
    this.topSuite = createSuiteMock('suite0', 'suite0 description');

    const anotherSuite = createSuiteMock(
      'suite1',
      'suite1 description',
      this.topSuite
    );

    const oneMoreSuite = createSuiteMock(
      'special_test_id_to_test_name_generation',
      'description',
      anotherSuite
    );

    anotherSuite.children.push(oneMoreSuite);

    this.topSuite.children.push(anotherSuite);

    this.env = { it: testMock, fit: testMock, topSuite: () => this.topSuite };

    this.getEnv = jest.fn(() => this.env);
  }
}

export class GlobalMock {
  constructor() {
    this.befores = [];
    this.afters = [];
    this.beforeAll = jest.fn(fn => this.befores.push(fn));
    this.afterAll = jest.fn(fn => this.afters.push(fn));
    this.jasmine = new JasmineMock();
  }

  callBeforeAll() {
    this.befores.forEach(fn => fn());
  }

  callAfterAll() {
    this.befores.forEach(fn => fn());
  }
}

export function MockDoneFn() {
  const spy = jest.fn();
  spy.fail = jest.fn();
  return spy;
}
