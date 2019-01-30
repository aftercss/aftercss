const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;
const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const TokenReaderWithSourceMap = require('@aftercss/tokenizer').TokenReaderWithSourceMap;

class InstanceWithInvalidContextFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'app.css');
    const context = {
      fileContent: content,
    };
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
  }
}

const instanceWithInvalidContextFixture = new InstanceWithInvalidContextFixture(__dirname);

module.exports = {
  runTest() {
    instanceWithInvalidContextFixture.runTask('sourcemap-instance-with-invalid-context');
  },
};
