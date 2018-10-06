import { setupPolly, IS_POLLY_SET_UP } from '../lib/setup';

class PollyMock {
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.stop = jest.fn(async () => {});
  }
}

const beforeAndAfterFnsMock = jest.fn(() => ({ befores: [], afters: [] }));

const testMock = jest.fn(name => {
  return {
    id: name,
    description: name,
    beforeAndAfterFns: beforeAndAfterFnsMock
  };
});

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

describe('setupPolly', () => {
  afterEach(() => {
    testMock.mockClear();
    beforeAndAfterFnsMock.mockClear();
  });

  it('should throw if jasmine env does not exist', () => {
    expect(() =>
      setupPolly(PollyMock, {}, null, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"Couldn't find jasmine environment. Make sure that you are using \`setupPolly\` in jasmine/jest environment or that you provided proper jasmine environment when calling setupPolly"`
    );
  });

  it('should throw if polly setupPolly is called twice', () => {
    const jasmine = new JasmineMock();

    setupPolly(PollyMock, {}, jasmine, {});

    expect(() =>
      setupPolly(PollyMock, {}, jasmine, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"Seems like polly is set up already. Please, call context.clearPolly to unset polly before setting it up again"`
    );
  });

  test.each(['it', 'fit'])('should override jasmine method `%s`', method => {
    const jasmine = new JasmineMock();
    const env = jasmine.getEnv();

    expect(env[method]).toBe(testMock);
    expect(env[method][IS_POLLY_SET_UP]).toBeUndefined();

    setupPolly(PollyMock, {}, jasmine, {});

    expect(env[method]).not.toBe(testMock);
    expect(env[method][IS_POLLY_SET_UP]).toBe(true);
  });

  test.each(['it', 'fit'])(
    'should return modified test case when `%s` is called after polly is set up',
    method => {
      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();
      const description = `test created with ${method}()`;

      const testCase = env[method](description);

      expect(testMock).toHaveBeenCalledTimes(1);
      expect(testMock).toHaveBeenCalledWith(description);

      expect(testCase).toHaveProperty('beforeAndAfterFns');
      expect(testCase).toHaveProperty('description');

      expect(testCase.description).toBe(description);
    }
  );

  test.each(['it', 'fit'])(
    'should add before and after hooks when beforeAndAfterFns is callen on `%s` test case',
    method => {
      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();

      setupPolly(PollyMock, {}, jasmine, {});

      const testCase = env[method]('test case');

      const { befores, afters } = testCase.beforeAndAfterFns();

      expect(afters).toHaveLength(1);
      expect(befores).toHaveLength(1);
    }
  );

  it('should return context with polly and clearPolly method', () => {
    const jasmine = new JasmineMock();

    const context = setupPolly(PollyMock, {}, jasmine, {});

    expect(context).toHaveProperty('polly', null);
    expect(context).toHaveProperty('clearPolly');
  });

  test.each(['it', 'fit'])(
    'should remove proxy from `%s` method when clearPolly is called',
    method => {
      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();

      expect(env[method]).toBe(testMock);
      expect(env[method][IS_POLLY_SET_UP]).toBeUndefined();

      const { clearPolly } = setupPolly(PollyMock, {}, jasmine, {});

      expect(env[method]).not.toBe(testMock);
      expect(env[method][IS_POLLY_SET_UP]).toBe(true);

      clearPolly();

      expect(env[method]).toBe(testMock);
      expect(env[method][IS_POLLY_SET_UP]).toBeUndefined();
    }
  );

  test.each(['it', 'fit'])(
    'should create instance of polly when before hook is called for `%s` test',
    method => {
      const done = jest.fn();
      const pollyOptions = {};

      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();

      const context = setupPolly(PollyMock, pollyOptions, jasmine, {});

      const testCase = env[method]('test case');

      const { befores } = testCase.beforeAndAfterFns();

      befores[0].fn(done);

      expect(done).toHaveBeenCalledTimes(1);

      expect(context.polly).toBeInstanceOf(PollyMock);
      expect(context.polly.name).toBe('test case');
      expect(context.polly.options).toBe(pollyOptions);
    }
  );

  it('should use parent suite names when generating name', () => {
    const pollyOptions = {};

    const jasmine = new JasmineMock();
    const env = jasmine.getEnv();

    const context = setupPolly(PollyMock, pollyOptions, jasmine, {});

    const testCase = env.it('special_test_id_to_test_name_generation');

    const { befores } = testCase.beforeAndAfterFns();

    befores[0].fn();

    expect(context.polly.name).toMatchInlineSnapshot(
      `"suite0 description/suite1 description/special_test_id_to_test_name_generation"`
    );
  });

  test.each(['it', 'fit'])(
    'should stop polly and remove it from context when after hook is called for `%s` test',
    async method => {
      const done = jest.fn();
      const pollyOptions = {};

      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();

      const context = setupPolly(PollyMock, pollyOptions, jasmine, {});

      const testCase = env[method]('test name');

      const { befores, afters } = testCase.beforeAndAfterFns();

      befores[0].fn(done);

      const tempPolly = context.polly;

      await afters[0].fn(done);

      expect(tempPolly.stop).toHaveBeenCalledTimes(1);
      expect(context.polly).toBe(null);
    }
  );
});
