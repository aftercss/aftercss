const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;

const CSSTokenizer = require('@aftercss/tokenizer');

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
    return res;
  }
}

const alltokensFixture = new AllTokensFixture(__dirname);

module.exports = {
  runTest() {
    alltokensFixture.runTask('AllTokens', 'app.css');
  },
};
