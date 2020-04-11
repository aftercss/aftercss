const fs = require('fs');
const path = require('path');
describe('ast-mainipulation', () => {
  const parserDirs = fs.readdirSync(__dirname).filter($ => $ !== 'index.js');
  for (const item of parserDirs) {
    (item === 'webkit-at-rule' ? it : it)(item, async () => {
      const dirname = path.resolve(__dirname, `${item}`);
      const indexJS = path.resolve(__dirname, `${item}/index.js`);
      const FixtureKlass = require(indexJS).default;
      const fixture = new FixtureKlass(dirname);
      await fixture.runTask(item);
    });
  }
});
