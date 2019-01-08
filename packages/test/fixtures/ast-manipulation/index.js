const appendChild = require('./append-child');
const clone = require('./clone');
const insertAfter = require('./insert-after');
const insertBefore = require('./insert-before');
const remove = require('./remove');
const replace = require('./replace');

module.exports = {
  runTest() {
    appendChild.runTest();
    clone.runTest();
    insertAfter.runTest();
    insertBefore.runTest();
    remove.runTest();
    replace.runTest();
  },
};