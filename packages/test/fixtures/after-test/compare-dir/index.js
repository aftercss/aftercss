const BaseFixture = require('after-test').BaseFixture;

it('after-test-compare-dir', async () => {
  const compareDirFixture = new BaseFixture(__dirname);
  await compareDirFixture.compareDir;
});
