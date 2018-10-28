const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;
const path = require('path');
const testExample = new BaseFixture(path.resolve(__dirname));

testExample.build = source => {
  return Promise.resolve(source + 'spades');
};

testExample.runTask('test');
