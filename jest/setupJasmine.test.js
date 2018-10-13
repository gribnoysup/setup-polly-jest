import {
  setupJasmine,
  IS_POLLY_ACTIVE,
  IS_POLLY_ATTACHED
} from '../lib/setupJasmine';

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

class GlobalMock {
  constructor() {
    this.befores = [];
    this.afters = [];

    this.beforeAll = jest.fn(fn => this.befores.push(fn));
    this.afterAll = jest.fn(fn => this.afters.push(fn));
  }

  __triggerBeforeAll() {
    this.befores.forEach(fn => fn());
  }

  __triggerAfterAll() {
    this.befores.forEach(fn => fn());
  }
}

describe('setupJasmine', () => {
  afterEach(() => {
    testMock.mockClear();
    beforeAndAfterFnsMock.mockClear();
  });

  it('should throw if jasmine env does not exist', () => {
    expect(() =>
      setupJasmine(PollyMock, {}, null, new GlobalMock())
    ).toThrowErrorMatchingInlineSnapshot(
      `"Couldn't find jasmine environment. Make sure that you are using \\"setupJasmine\\" in jasmine/jest environment or that you provided proper jasmine environment when calling \\"setupJasmine\\""`
    );
  });

  test.each(['it', 'fit'])('should override jasmine method `%s`', method => {
    const jasmine = new JasmineMock();
    const env = jasmine.getEnv();

    expect(env[method]).toBe(testMock);

    expect(env[IS_POLLY_ATTACHED]).toBeUndefined();
    expect(env[IS_POLLY_ACTIVE]).toBeUndefined();

    setupJasmine(PollyMock, {}, jasmine, new GlobalMock());

    expect(env[method]).not.toBe(testMock);

    expect(env[IS_POLLY_ATTACHED]).toBe(true);
    expect(env[IS_POLLY_ACTIVE]).toBe(false);
  });

  test.each(['it', 'fit'])(
    'should return modified test case when `%s` is called after polly is set up',
    method => {
      const jasmine = new JasmineMock();
      const global = new GlobalMock();
      const env = jasmine.getEnv();
      const description = `test created with ${method}()`;

      setupJasmine(PollyMock, {}, jasmine, global);

      global.__triggerBeforeAll();

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

      setupJasmine(PollyMock, {}, jasmine, new GlobalMock());

      const testCase = env[method]('test case');

      const { befores, afters } = testCase.beforeAndAfterFns();

      expect(afters).toHaveLength(1);
      expect(befores).toHaveLength(1);
    }
  );

  it('should return context with polly and clearPolly method', () => {
    const jasmine = new JasmineMock();

    const context = setupJasmine(PollyMock, {}, jasmine, new GlobalMock());

    expect(context).toHaveProperty('polly', null);
    expect(context).toHaveProperty('clearPolly');
  });

  test.each(['it', 'fit'])(
    'should create instance of polly when before hook is called for `%s` test',
    method => {
      const done = jest.fn();
      const pollyOptions = {};

      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();
      const global = new GlobalMock();

      const context = setupJasmine(PollyMock, pollyOptions, jasmine, global);

      global.__triggerBeforeAll();

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
    const jasmine = new JasmineMock();
    const env = jasmine.getEnv();
    const global = new GlobalMock();

    const context = setupJasmine(PollyMock, {}, jasmine, global);

    global.__triggerBeforeAll();

    const testCase = env.it('special_test_id_to_test_name_generation');

    const { befores } = testCase.beforeAndAfterFns();

    befores[0].fn();

    expect(context.polly.name).toMatchInlineSnapshot(
      `"suite1 description/special_test_id_to_test_name_generation"`
    );
  });

  test.each(['it', 'fit'])(
    'should stop polly and remove it from context when after hook is called for `%s` test',
    async method => {
      const done = jest.fn();

      const jasmine = new JasmineMock();
      const env = jasmine.getEnv();
      const global = new GlobalMock();

      const context = setupJasmine(PollyMock, {}, jasmine, global);

      global.__triggerBeforeAll();

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
