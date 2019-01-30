const currentToken = require('./current-token');
const getNextToken = require('./get-next-token');
module.exports = {
  runTest() {
    currentToken.runTest();
    getNextToken.runTest();
  },
};
