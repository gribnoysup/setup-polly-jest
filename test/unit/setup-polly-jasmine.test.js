import { Polly } from '@pollyjs/core';
import { setupPollyJasmine } from '../../lib/jasmine';
import { JestPollyGlobals } from '../../lib/common';
import {
  GlobalMock,
  beforeAndAfterFnsMock,
  testMock,
  MockDoneFn
} from './__mocks__/global';
import { PollyMock } from './__mocks__/polly';

describe('setupPollyJasmine', () => {
  afterEach(() => {
    testMock.mockClear();
    beforeAndAfterFnsMock.mockClear();
  });

  it('should return null if jasmine env does not exist', () => {
    expect(setupPollyJasmine(PollyMock, {}, {})).toBe(null);
  });

  it('should fail the test in before hook when something went wrong', () => {
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();

    setupPollyJasmine(
      {},
      function Polly() {
        throw new Error('whoops');
      },
      stub
    );

    stub.callBeforeAll();

    const testCase = env.it('test case');

    const { fn: before } = testCase.beforeAndAfterFns().befores[0];

    const done = new MockDoneFn();

    before(done);

    expect(done).toHaveBeenCalledTimes(0);
    expect(done.fail).toHaveBeenCalledTimes(1);
  });

  it('should fail the tests in after hooks when Polly throws', () => {
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();

    setupPollyJasmine({ persister: 'will-throw' }, Polly, stub);

    stub.callBeforeAll();

    const testCase = env.it('test case');

    const { fn: before } = testCase.beforeAndAfterFns().befores[0];
    const { fn: after } = testCase.beforeAndAfterFns().afters[0];

    const done = new MockDoneFn();

    before(done);

    expect(done).toHaveBeenCalledTimes(1);
    expect(done.fail).toHaveBeenCalledTimes(0);

    after(done);

    expect(done).toHaveBeenCalledTimes(1);
    expect(done.fail).toHaveBeenCalledTimes(1);
  });

  test.each(['it', 'fit'])('should override jasmine method `%s`', method => {
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();
    const globals = new JestPollyGlobals(stub);

    expect(env[method]).toBe(testMock);

    expect(globals.isPollyAttached).toBeUndefined();
    expect(globals.isPollyActive).toBeUndefined();

    setupPollyJasmine({}, PollyMock, stub);

    expect(env[method]).not.toBe(testMock);

    expect(globals.isPollyAttached).toBe(true);
    expect(globals.isPollyActive).toBe(false);
  });

  test.each(['it', 'fit'])(
    'should return modified test case when `%s` is called after polly is set up',
    method => {
      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();
      const description = `test created with ${method}()`;

      setupPollyJasmine({}, PollyMock, stub);

      stub.callBeforeAll();

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
      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();

      setupPollyJasmine({}, PollyMock, stub);

      const testCase = env[method]('test case');

      const { befores, afters } = testCase.beforeAndAfterFns();

      expect(afters).toHaveLength(1);
      expect(befores).toHaveLength(1);
    }
  );

  it('should return context with polly', () => {
    const stub = new GlobalMock();

    const context = setupPollyJasmine({}, PollyMock, stub);

    expect(() => context.polly).toThrowError();
  });

  test.each(['it', 'fit'])(
    'should create instance of polly when before hook is called for `%s` test',
    method => {
      const done = new MockDoneFn();
      const pollyOptions = {};

      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();

      const context = setupPollyJasmine(pollyOptions, PollyMock, stub);

      stub.callBeforeAll();

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
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();

    const context = setupPollyJasmine({}, PollyMock, stub);

    stub.callBeforeAll();

    const testCase = env.it('special_test_id_to_test_name_generation');

    const { befores } = testCase.beforeAndAfterFns();

    befores[0].fn(new MockDoneFn());

    expect(context.polly.name).toMatchInlineSnapshot(
      `"suite1 description/special_test_id_to_test_name_generation"`
    );
  });

  test.each(['it', 'fit'])(
    'should stop polly and remove it from context when after hook is called for `%s` test',
    async method => {
      const done = new MockDoneFn();
      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();

      const context = setupPollyJasmine({}, PollyMock, stub);

      stub.callBeforeAll();

      const testCase = env[method]('test name');

      const { befores, afters } = testCase.beforeAndAfterFns();

      befores[0].fn(done);

      const tempPolly = context.polly;

      await afters[0].fn(done);

      expect(tempPolly.stop).toHaveBeenCalledTimes(1);
      expect(() => context.polly).toThrowError();
    }
  );
});
