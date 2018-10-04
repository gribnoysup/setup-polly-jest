import { setupPolly } from "../lib/setup";

class PollyMock {
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.stop = jest.fn(async () => {});
  }
}

const beforeAndAfterFnsMock = jest.fn(() => ({ befores: [], afters: [] }));

const testMock = jest.fn((name, fn, timeout) => {
  return {
    getFullName: jest.fn(() => name),
    beforeAndAfterFns: beforeAndAfterFnsMock
  };
});

class JasmineMock {
  constructor() {
    this.env = { it: testMock };
    this.getEnv = jest.fn(() => this.env);
  }
}

describe("setupPolly", () => {
  afterEach(() => {
    testMock.mockClear();
    beforeAndAfterFnsMock.mockClear();
  });

  it("should throw if jasmine env does not exist", () => {
    expect(() =>
      setupPolly(PollyMock, {}, null, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"Couldn't find jasmine environment. Make sure that you are using \`setupPolly\` in jasmine/jest environment or that you provided proper jasmine environment when calling setupPolly"`
    );
  });

  it("should throw if polly setupPolly is called twice", () => {
    const jasmine = new JasmineMock();

    setupPolly(PollyMock, {}, jasmine, {});

    expect(() =>
      setupPolly(PollyMock, {}, jasmine, {})
    ).toThrowErrorMatchingInlineSnapshot(
      `"Seems like polly is set up already. Please, call context.clearPolly to unset polly before setting it up again"`
    );
  });

  it("should override jasmine `it` method", () => {
    const jasmine = new JasmineMock();

    expect(jasmine.getEnv().it).toBe(testMock);

    setupPolly(PollyMock, {}, jasmine, {});

    expect(jasmine.getEnv().it).not.toBe(testMock);
  });

  it("should returned modified test case after setupPolly is called", () => {
    const jasmine = new JasmineMock();

    setupPolly(PollyMock, {}, jasmine, {});

    const testCase = jasmine.getEnv().it("test1");

    expect(testMock).toHaveBeenCalledTimes(1);
    expect(testMock).toHaveBeenCalledWith("test1");

    expect(testCase).toHaveProperty("beforeAndAfterFns");
    expect(testCase).toHaveProperty("getFullName");

    expect(testCase.getFullName()).toMatchInlineSnapshot(`"test1"`);
  });

  it("should add custom before and after hooks when beforeAndAfterFns is called", () => {
    const jasmine = new JasmineMock();

    setupPolly(PollyMock, {}, jasmine, {});

    const testCase = jasmine.getEnv().it();

    const { befores, afters } = testCase.beforeAndAfterFns();

    expect(afters).toHaveLength(1);
    expect(befores).toHaveLength(1);
  });

  it("should return context with polly and clearPolly method", () => {
    const jasmine = new JasmineMock();

    const context = setupPolly(PollyMock, {}, jasmine, {});

    expect(context).toHaveProperty("polly", null);
    expect(context).toHaveProperty("clearPolly");
  });

  it("should unmock jasmine.it when clearPolly is called", () => {
    const jasmine = new JasmineMock();

    expect(jasmine.getEnv().it).toBe(testMock);

    const { clearPolly } = setupPolly(PollyMock, {}, jasmine, {});

    expect(jasmine.getEnv().it).not.toBe(testMock);

    clearPolly();

    expect(jasmine.getEnv().it).toBe(testMock);
  });

  it("should create instace of polly when before hook is called", () => {
    const done = jest.fn();
    const pollyOptions = {};

    const jasmine = new JasmineMock();

    const context = setupPolly(PollyMock, pollyOptions, jasmine, {});

    const testCase = jasmine.getEnv().it("test3");

    const { befores } = testCase.beforeAndAfterFns();

    befores[0].fn(done);

    expect(done).toHaveBeenCalledTimes(1);

    expect(context.polly).toBeInstanceOf(PollyMock);
    expect(context.polly.name).toBe("test3");
    expect(context.polly.options).toBe(pollyOptions);
  });

  it("should stop polly and remove it from context when after hook is called", async () => {
    const done = jest.fn();
    const pollyOptions = {};

    const jasmine = new JasmineMock();

    const context = setupPolly(PollyMock, pollyOptions, jasmine, {});

    const testCase = jasmine.getEnv().it("test name");

    const { befores, afters } = testCase.beforeAndAfterFns();

    befores[0].fn(done);

    const tempPolly = context.polly;

    await afters[0].fn(done);

    expect(tempPolly.stop).toHaveBeenCalledTimes(1);
    expect(context.polly).toBe(null);
  });
});
