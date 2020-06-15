const JSDOMEnvironment = require('jest-environment-jsdom');
const { PollyEnvironmentFactory } = require('./lib/jest-environment-polly');

class PollyEnvironmentJSDOM extends PollyEnvironmentFactory(JSDOMEnvironment) {}

module.exports = PollyEnvironmentJSDOM;
