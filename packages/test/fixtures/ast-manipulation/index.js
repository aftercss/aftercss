const appendChild = require('./append-child');
const clone = require('./clone');
const getIndex = require('./get-index');
const insertAfter = require('./insert-after');
const insertBefore = require('./insert-before');
const invalidAppendChild = require('./invalid-append-child');
const invalidInsertAfter = require('./invalid-insert-after');
const invalidInsertBefore = require('./invalid-insert-before');
const invalidReplace = require('./invalid-replace');
const remove = require('./remove');
const replace = require('./replace');

module.exports = {
  runTest() {
    appendChild.runTest();
    clone.runTest();
    getIndex.runTest();
    insertAfter.runTest();
    insertBefore.runTest();
    invalidAppendChild.runTest();
    invalidInsertAfter.runTest();
    invalidInsertBefore.runTest();
    invalidReplace.runTest();
    remove.runTest();
    replace.runTest();
  },
};
