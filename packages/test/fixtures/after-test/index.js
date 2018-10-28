const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;
const path = require('path');
const testExample = new BaseFixture(path.resolve(__dirname));

testExample.build = () => {
  return Promise.resolve('spades');
};

testExample.runTask('test', 's.js');
