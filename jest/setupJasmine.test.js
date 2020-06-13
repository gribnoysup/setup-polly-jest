import { Polly } from '@pollyjs/core';
import { setupJasmine } from '../lib/jasmine/setupJasmine';

import {
  GlobalMock,
  beforeAndAfterFnsMock,
  testMock
} from './__mocks__/global';

import { PollyMock } from './__mocks__/polly';

const { IS_POLLY_ACTIVE, IS_POLLY_ATTACHED } = setupJasmine;

const mockDone = () => {
  const done = jest.fn();
  done.fail = jest.fn();
  return done;
};

describe('setupJasmine', () => {
  afterEach(() => {
    testMock.mockClear();
    beforeAndAfterFnsMock.mockClear();
  });

  it('should throw if jasmine env does not exist', () => {
    expect(() => setupJasmine(PollyMock, {}, {})).toThrowError();
  });

  it('should fail the test in before hook when something went wrong', () => {
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();

    setupJasmine(
      function Polly() {
        throw new Error('whoops');
      },
      {},
      stub
    );

    stub.callBeforeAll();

    const testCase = env.it('test case');

    const { fn: before } = testCase.beforeAndAfterFns().befores[0];

    const done = mockDone();

    before(done);

    expect(done).toHaveBeenCalledTimes(0);
    expect(done.fail).toHaveBeenCalledTimes(1);
  });

  it('should fail the tests in after hooks when Polly throws', () => {
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();

    setupJasmine(Polly, { persister: 'will-throw' }, stub);

    stub.callBeforeAll();

    const testCase = env.it('test case');

    const { fn: before } = testCase.beforeAndAfterFns().befores[0];
    const { fn: after } = testCase.beforeAndAfterFns().afters[0];

    const done = mockDone();

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

    expect(env[method]).toBe(testMock);

    expect(env[IS_POLLY_ATTACHED]).toBeUndefined();
    expect(env[IS_POLLY_ACTIVE]).toBeUndefined();

    setupJasmine(PollyMock, {}, stub);

    expect(env[method]).not.toBe(testMock);

    expect(env[IS_POLLY_ATTACHED]).toBe(true);
    expect(env[IS_POLLY_ACTIVE]).toBe(false);
  });

  test.each(['it', 'fit'])(
    'should return modified test case when `%s` is called after polly is set up',
    method => {
      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();
      const description = `test created with ${method}()`;

      setupJasmine(PollyMock, {}, stub);

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

      setupJasmine(PollyMock, {}, stub);

      const testCase = env[method]('test case');

      const { befores, afters } = testCase.beforeAndAfterFns();

      expect(afters).toHaveLength(1);
      expect(befores).toHaveLength(1);
    }
  );

  it('should return context with polly', () => {
    const stub = new GlobalMock();

    const context = setupJasmine(PollyMock, {}, stub);

    expect(context).toHaveProperty('polly', null);
  });

  test.each(['it', 'fit'])(
    'should create instance of polly when before hook is called for `%s` test',
    method => {
      const done = jest.fn();
      const pollyOptions = {};

      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();

      const context = setupJasmine(PollyMock, pollyOptions, stub);

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

    const context = setupJasmine(PollyMock, {}, stub);

    stub.callBeforeAll();

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
      const stub = new GlobalMock();
      const env = stub.jasmine.getEnv();

      const context = setupJasmine(PollyMock, {}, stub);

      stub.callBeforeAll();

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
