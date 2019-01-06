const afterTest = require('./fixtures/after-test');
const alltokensTest = require('./fixtures/alltokens');
const astManipulationTest = require('./fixtures/ast-manipulation');
const parserTest = require('./fixtures/parser/parser.fixture');
const removeCommentTest = require('./fixtures/remove-comments');
const sourcemapTest = require('./fixtures/sourcemap');
const tokenTest = require('./fixtures/token/token.fixture');

afterTest.runTest();
alltokensTest.runTest();
astManipulationTest.runTest();
parserTest.runTest();
removeCommentTest.runTest();
sourcemapTest.runTest();
tokenTest.runTest();
