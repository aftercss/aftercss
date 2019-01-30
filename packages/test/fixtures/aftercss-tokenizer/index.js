const alltokensTest = require('./alltokens');
const sourcemapTest = require('./source-map');
const tokenTest = require('./token');
const tokenReaderTest = require('./stream-token');
const tokenizerTest = require('./tokenizer');

module.exports = {
  runTest() {
    alltokensTest.runTest();
    sourcemapTest.runTest();
    tokenTest.runTest();
    tokenReaderTest.runTest();
    tokenizerTest.runTest();
  },
};
