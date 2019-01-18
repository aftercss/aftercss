const BaseFixture = require('after-test').BaseFixture;
const assert = require('assert');

module.exports = {
  runTest() {
    const writeFileErrFixture = new BaseFixture(__dirname);
    it('after-test-writefile-err-string', async () => {
      try {
        await writeFileErrFixture.writeFile('actual', 1, 'test.txt');
      } catch (e) {
        assert.equal(e.message, '[Aftertest writeFile]  Filename/Content must be a string.');
      }
    });
    it('after-test-writefile-err-type', async () => {
      try {
        await writeFileErrFixture.writeFile('test', '1', 'test.txt');
      } catch (e) {
        assert.equal(e.message, '[Aftertest writeFile]  Type is wrong.');
      }
    });
  },
};
