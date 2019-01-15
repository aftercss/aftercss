const afterTest = require('./fixtures/after-test');
const aftercssParser = require('./fixtures/aftercss-parser');
const aftercssTokenizer = require('./fixtures/aftercss-tokenizer');
const removeCommentTest = require('./fixtures/remove-comments');

afterTest.runTest();
aftercssParser.runTest();
aftercssTokenizer.runTest();
removeCommentTest.runTest();
