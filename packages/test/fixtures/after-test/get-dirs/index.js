const BaseFixture = require('after-test').BaseFixture;
const assert = require('assert');
const path = require('path');

it('after-test-get-dirs', async () => {
  const dirsFixture = new BaseFixture(__dirname);
  const dirs = await dirsFixture.getAllDirs(path.resolve(__dirname, './dirs'));
  assert.equal(dirs.length, 0);
});
