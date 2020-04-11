const fs = require('fs');
const parserDirs = fs.readdirSync(__dirname).filter($ => $ !== 'index.js');
describe('test', () => {
  for (const item of parserDirs) {
    it(item, () => {
      require('./' + item);
    });
  }
});
