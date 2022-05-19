const JSDOMEnvironment = require('jest-environment-jsdom').default;
const { PollyEnvironmentFactory } = require('./lib/jest-environment-polly');

class PollyEnvironmentJSDOM extends PollyEnvironmentFactory(JSDOMEnvironment) {}

module.exports = PollyEnvironmentJSDOM;
