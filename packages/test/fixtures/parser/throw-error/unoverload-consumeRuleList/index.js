const BaseParser = require('@aftercss/parser').BaseParser;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

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
    const parser = new BaseParser(tokens);
    const ast = parser.parseStyleSheet();
    const res = JSON.stringify(ast, null, 2);
    await this.writeFile('actual', res, 'index.json');
  }
}

module.exports = {
  runTest() {
    const tokenFixture = new ParsreFixture(__dirname);
    tokenFixture.runTask('unoverload-consumeRuleList');
  },
};
