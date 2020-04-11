const BaseFixture = require('after-test').BaseFixture;
const assert = require('assert');

it('after-test-readfile-err', async () => {
  const readFileFixture = new BaseFixture(__dirname);
  try {
    await readFileFixture.readFile('test');
  } catch (e) {
    assert.equal(e.message, '[Aftertest readFile]  Type is wrong.');
  }
});
