const BaseFixture = require('after-test').BaseFixture;
const assert = require('assert');

module.exports = {
  runTest() {
    it('after-test-nonoverload-build', async () => {
      const buildFixture = new BaseFixture(__dirname);
      try {
        await buildFixture.build();
      } catch (e) {
        assert.equal(e.message, 'error should be emitted');
      }
    });
  },
};
