const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;

const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const AfterContext = require('@aftercss/shared').AfterContext;

const generateSourceMap = require('@aftercss/tokenizer').generateSourceMap;

class AllTokensFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'app.css');
    const tokenizer = new CSSTokenizer(
      new AfterContext({
        fileContent: content,
        sourceMap: true,
      }),
    );
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
      if (token.type === 'COMMENT') {
        continue;
      }
      res += token.raw;
    }
    await this.writeFile('actual', res, 'index.css');
  }
}

const alltokensFixture = new AllTokensFixture(__dirname);

it('remove comments', async () => {
  await alltokensFixture.runTask('RemoveComments');
});
