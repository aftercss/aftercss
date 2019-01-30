const validTest = require('./valid');
const throwErrorTest = require('./throw-error');

module.exports = {
  runTest() {
    validTest.runTest();
    throwErrorTest.runTest();
  },
};
