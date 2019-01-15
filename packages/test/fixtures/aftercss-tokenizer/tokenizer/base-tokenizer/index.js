const allowWhiteSpace = require('./allow-whitespace');
const eat = require('./eat');
const readUntil = require('./read-until');

module.exports = {
  runTest() {
    allowWhiteSpace.runTest();
    eat.runTest();
    readUntil.runTest();
  },
};
