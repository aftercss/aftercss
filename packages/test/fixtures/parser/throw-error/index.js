const unoverloadConsumeRuleList = require('./unoverload-consumeRuleList');
const noColonInDecl = require('./no-colon-decl');
const unclosedFunc = require('./unclosed-func');

module.exports = {
  runTest() {
    unoverloadConsumeRuleList.runTest();
    noColonInDecl.runTest();
    unclosedFunc.runTest();
  },
};
