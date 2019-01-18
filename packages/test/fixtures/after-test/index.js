const compareDir = require('./compare-dir');
const compareErr = require('./compare-err');
const getDirs = require('./get-dirs');
const moveActToExp = require('./move-actual-to-expect');
const nonoverloadBuild = require('./nonoverload-build');
const readFileErr = require('./readfile-err');
const writeFileErr = require('./writefile-err');

module.exports = {
  runTest() {
    compareDir.runTest();
    compareErr.runTest();
    getDirs.runTest();
    moveActToExp.runTest();
    nonoverloadBuild.runTest();
    readFileErr.runTest();
    writeFileErr.runTest();
  },
};
