const astManipulationTest = require('./ast-manipulation');
const parserNodeTest = require('./parser-nodes');

module.exports = {
  runTest() {
    astManipulationTest.runTest();
    parserNodeTest.runTest();
  },
};
