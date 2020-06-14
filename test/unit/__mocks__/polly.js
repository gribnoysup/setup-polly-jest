export class PollyMock {
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.stop = jest.fn(async () => {});
  }
}
