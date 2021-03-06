const CSSParser = require('@aftercss/parser').CSSParser;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;
const fs = require('fs');
const path = require('path');

class ParsreFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const tokenizer = new Tokenizer(
      new AfterContext({
        fileContent: content,
      }),
    );
    tokenizer.preprocess();
    const tokens = [];
    while (true) {
      const token = tokenizer.nextToken();
      tokens.push(token);
      if (token.type === 'EOF') {
        break;
      }
    }
    const parser = new CSSParser(tokens);
    const ast = parser.parseStyleSheet();
    const res = JSON.stringify(ast, null, 2);
    await this.writeFile('actual', res, 'index.json');
  }
}
describe('valid', () => {
  const parserDirs = fs.readdirSync(__dirname).filter($ => $ !== 'index.js');
  for (const item of parserDirs) {
    (item === 'webkit-at-rule' ? it : it)(item, async () => {
      const tokenFixture = new ParsreFixture(path.resolve(__dirname, item));
      await tokenFixture.runTask(`${item}`);
    });
  }
});
