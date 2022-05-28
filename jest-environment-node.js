let NodeEnvironment = require('jest-environment-node');
NodeEnvironment =
  NodeEnvironment.default || NodeEnvironment.TestEnvironment || NodeEnvironment;
const { PollyEnvironmentFactory } = require('./lib/jest-environment-polly');

class PollyEnvironmentNode extends PollyEnvironmentFactory(NodeEnvironment) {}

module.exports = PollyEnvironmentNode;
