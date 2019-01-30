const instanceWithTokenizer = require('./instance-with-tokenizer');
const instanceWithTokens = require('./instance-with-tokens');

module.exports = {
  runTest() {
    instanceWithTokenizer.runTest();
    instanceWithTokens.runTest();
  },
};
