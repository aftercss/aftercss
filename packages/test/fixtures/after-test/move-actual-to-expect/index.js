const BaseFixture = require('after-test').BaseFixture;
const assert = require('assert');

module.exports = {
  runTest() {
    it('after-test-move-actual-to-expect', async () => {
      const moveFixture = new BaseFixture(__dirname);
      await moveFixture.moveActualToExpect();
      assert(true);
    });
  },
};
