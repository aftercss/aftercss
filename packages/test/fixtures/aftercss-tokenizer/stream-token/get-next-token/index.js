const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;
const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const TokenReaderWithSourceMap = require('@aftercss/tokenizer').TokenReaderWithSourceMap;
const AfterContext = require('@aftercss/shared').AfterContext;

class GetNextTokenFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'app.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    tokenizer.preprocess();
    const tokens = [];
    while (true) {
      const currentToken = tokenizer.nextToken();
      tokens.push(currentToken);
      if (currentToken.type === 'EOF') {
        break;
      }
    }
    const tokenReader = new TokenReaderWithSourceMap(tokens, context);
    const nextToken = tokenReader.getNextToken();
    await this.writeFile('actual', JSON.stringify(nextToken, null, 2), 'nextToken.json');
  }
}

const getNextTokenFixture = new GetNextTokenFixture(__dirname);

module.exports = {
  runTest() {
    getNextTokenFixture.runTask('token-reader-get-next-token');
  },
};
