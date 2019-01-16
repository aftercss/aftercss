const allowWhiteSpace = require('./allow-whitespace');
const eat = require('./eat');
const eatEof = require('./eat-eof');
const readUntil = require('./read-until');

module.exports = {
  runTest() {
    allowWhiteSpace.runTest();
    eat.runTest();
    eatEof.runTest();
    readUntil.runTest();
  },
};
