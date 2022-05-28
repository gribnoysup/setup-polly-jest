let JSDOMEnvironment = require('jest-environment-jsdom');
JSDOMEnvironment =
  JSDOMEnvironment.default ||
  JSDOMEnvironment.TestEnvironment ||
  JSDOMEnvironment;
const { PollyEnvironmentFactory } = require('./lib/jest-environment-polly');

class PollyEnvironmentJSDOM extends PollyEnvironmentFactory(JSDOMEnvironment) {}

module.exports = PollyEnvironmentJSDOM;
