const fs = require('fs');
const parserDirs = fs.readdirSync(__dirname).filter($ => $ !== 'index.js');
describe('aftercss-tokenizer', () => {
  for (const item of parserDirs) {
    describe(item, () => {
      require('./' + item);
    });
  }
});
