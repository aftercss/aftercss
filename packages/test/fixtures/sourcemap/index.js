const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;

const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const TokenReaderWithSourceMap = require('@aftercss/tokenizer').TokenReaderWithSourceMap;
const AfterContext = require('@aftercss/shared').AfterContext;

const generateSourceMap = require('@aftercss/tokenizer').generateSourceMap;

class AllTokensFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'app.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    tokenizer.preprocess();
    const tokenReader = new TokenReaderWithSourceMap(tokenizer);
    const tokens = [];
    while (true) {
      const currentToken = tokenReader.currentToken();
      tokens.push(currentToken);
      tokenReader.step();
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
    const sourcemapContent = tokenReader.generateSourceMap(tokens, 'index.css');
    await this.writeFile('actual', sourcemapContent, 'index.css.map');
    res += '/*# sourceMappingURL=index.css.map */';
    await this.writeFile('actual', res, 'index.css');
  }
}

const alltokensFixture = new AllTokensFixture(__dirname);

module.exports = {
  runTest() {
    alltokensFixture.runTask('SourceMap');
  },
};
