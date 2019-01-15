const CSSParser = require('@aftercss/parser').CSSParser;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

class AstCloneFixture extends BaseFixture {
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
    const cloned = ast.clone();
    ast.childNodes[1].clone();
    await this.writeFile('actual', JSON.stringify(cloned, null, 2), 'clone.json');
  }
}

module.exports = {
  runTest() {
    const tokenFixture = new AstCloneFixture(__dirname);
    tokenFixture.runTask('ast-clone');
  },
};

module.exports.runTest();
