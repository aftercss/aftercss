const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;
const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const TokenReader = require('@aftercss/tokenizer').TokenReader;
const AfterContext = require('@aftercss/shared').AfterContext;

class CurrentTokenFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'app.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    tokenizer.preprocess();
    const tokens = [];
    const tokenReader = new TokenReader(tokens, context);
    const currentToken = tokenReader.currentToken();
    await this.writeFile('actual', JSON.stringify(currentToken, null, 2), 'nextToken.json');
  }
}

const currentTokenFixture = new CurrentTokenFixture(__dirname);
it('token-reader-current-token', async () => {
  await currentTokenFixture.runTask('token-reader-current-token');
});