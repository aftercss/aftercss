const CSSParser = require('@aftercss/parser').CSSParser;
const Comment = require('@aftercss/parser').Comment;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

class AstReplaceFixture extends BaseFixture {
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
    ast.insertAfter(new Comment('insert after'));
  }
}

module.exports = {
  runTest() {
    const tokenFixture = new AstReplaceFixture(__dirname);
    tokenFixture.runTask('ast-invalid-insert-after');
  },
};
