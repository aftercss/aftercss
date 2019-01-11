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
    const res = JSON.stringify(ast, null, 2);
    await this.writeFile('actual', res, 'index.json');
  }
}
const parserDirs = fs.readdirSync(__dirname);

module.exports = {
  runTest() {
    parserDirs.forEach(item => {
      if (item === 'index.js') {
        return;
      }
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
      tokenFixture.runTask(`${item}`);
    });
  },
};
