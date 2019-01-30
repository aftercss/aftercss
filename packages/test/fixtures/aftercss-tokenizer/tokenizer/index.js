const baseTokenizer = require('./base-tokenizer');
const cssTokenizerHelper = require('./css-tokenizer-helper');

module.exports = {
  runTest() {
    baseTokenizer.runTest();
    cssTokenizerHelper.runTest();
  },
};
