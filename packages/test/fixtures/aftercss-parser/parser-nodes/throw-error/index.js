const CSSParser = require('@aftercss/parser').CSSParser;
const BaseParser = require('@aftercss/parser').BaseParser;
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
  }
}
const parserDirs = fs.readdirSync(__dirname).filter($ => $ !== 'index.js');
describe('throw-error', () => {
  for (const item of parserDirs) {
    (item === 'webkit-at-rule' ? it : it)(item, async () => {
      const tokenFixture = new ParsreFixture(path.resolve(__dirname, item));
      if (item === 'unoverload-consumeRuleList') {
        tokenFixture.build = async function() {
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
          const parser = new BaseParser(tokens);
          const ast = parser.parseStyleSheet();
        };
      }
      await tokenFixture.runTask(`${item}`);
    });
  }
});
