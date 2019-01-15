const validTest = require('./valid');
const errorTest = require('./throw-error');

module.exports = {
  runTest() {
    validTest.runTest();
    errorTest.runTest();
  },
};
