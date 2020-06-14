const NodeEnvironment = require('jest-environment-node');
const { PollyEnvironmentFactory } = require('./lib/jest-environment-polly');

class PollyEnvironmentNode extends PollyEnvironmentFactory(NodeEnvironment) {}

module.exports = PollyEnvironmentNode;
