const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;

const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;

class AllTokensFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'app.css');
    const tokenizer = new CSSTokenizer(content);
    tokenizer.preprocess();
    const tokens = [];
    while (true) {
      const currentToken = tokenizer.nextToken();
      tokens.push(currentToken);
      if (currentToken.type === 'EOF') {
        break;
      }
    }
    let res = '';
    for (let token of tokens) {
      if (token.type === 'EOF') {
        break;
      }
      res += token.raw;
    }
    this.writeFile('actual', res, 'index.css');
    this.writeFile('actual', JSON.stringify(tokens, null, 2), 'tokens.json');
  }
}

const alltokensFixture = new AllTokensFixture(__dirname);

module.exports = {
  runTest() {
    alltokensFixture.runTask('AllTokens', 'app.css');
  },
};
