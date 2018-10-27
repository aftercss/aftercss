const BaseFixture = require('../lib/base-fixture').BaseFixture;
const path = require('path');
const fs = require('fs')
const testExample = new BaseFixture(path.resolve(__dirname));

testExample.build = function(source) {
    return source + 'spades';
}

testExample.runTask('test-1')