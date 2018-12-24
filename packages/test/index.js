const afterTest = require('./fixtures/after-test');
const alltokensTest = require('./fixtures/alltokens');
const parserTest = require('./fixtures/parser/parser.fixture');
const removeCommentTest = require('./fixtures/remove-comments');
const sourcemapTest = require('./fixtures/sourcemap');
const tokenTest = require('./fixtures/token/token.fixture');

afterTest.runTest();
alltokensTest.runTest();
parserTest.runTest();
removeCommentTest.runTest();
sourcemapTest.runTest();
tokenTest.runTest();
