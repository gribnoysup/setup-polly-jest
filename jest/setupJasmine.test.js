import { Polly } from '@pollyjs/core';
import setupJasmine from '../lib/setupJasmine';

import {
  GlobalMock,
  beforeAndAfterFnsMock,
  testMock
} from './__mocks__/global';

import { PollyMock } from './__mocks__/polly';

const { IS_POLLY_ACTIVE, IS_POLLY_ATTACHED } = setupJasmine;

describe('setupJasmine', () => {
  afterEach(() => {
    testMock.mockClear();
    beforeAndAfterFnsMock.mockClear();
  });

  it('should throw if jasmine env does not exist', () => {
    expect(() =>
      setupJasmine(PollyMock, {}, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"Couldn't find jasmine environment. Make sure that you are using \\"setupJasmine\\" in jasmine/jest environment or that you provided proper jasmine environment when calling \\"setupJasmine\\""`
    );
  });

  it('should fail the test when something goes wrong while creating polly instance', () => {
    const stub = new GlobalMock();
    const env = stub.jasmine.getEnv();

    setupJasmine(
      Polly,
      { persister: 'this one will fail polly with error' },
      stub
    );

    stub.callBeforeAll();

    const testCase = env.it('test case');

    const { fn: before } = testCase.beforeAndAfterFns().befores[0];

    const done = jest.fn();

    done.fail = jest.fn();

    before(done);

    expect(done).toHaveBeenCalledTimes(0);
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
