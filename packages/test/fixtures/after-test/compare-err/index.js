const BaseFixture = require('after-test').BaseFixture;
const assert = require('assert');

module.exports = {
  runTest() {
    it('after-test-compare-err', async () => {
      const compareErrFixture = new BaseFixture(__dirname);
      try {
        await compareErrFixture.compareError(new Error('new error'));
      } catch (e) {
        assert.equal(e.message, 'new error');
      }
    });
  },
};
