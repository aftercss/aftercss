const afterTest = require('./fixtures/after-test');
const alltokensTest = require('./fixtures/alltokens');
const removeCommentTest = require('./fixtures/removeComments');
const sourcemapTest = require('./fixtures/sourcemap');
const tokenTest = require('./fixtures/token/token.fixture');

afterTest.runTest();
alltokensTest.runTest();
removeCommentTest.runTest();
sourcemapTest.runTest();
tokenTest.runTest();
