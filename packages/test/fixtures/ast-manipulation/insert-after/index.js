const CSSParser = require('@aftercss/parser').CSSParser;
const Comment = require('@aftercss/parser').Comment;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

class AstInsertAfterFixture extends BaseFixture {
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
    ast.childNodes[0].insertAfter([new Comment('first'), new Comment('second')]);
    await this.writeFile('actual', JSON.stringify(ast, null, 2), 'insert-after.json');
  }
}

module.exports = {
  runTest() {
    const tokenFixture = new AstInsertAfterFixture(__dirname);
    tokenFixture.runTask('ast-insert-after');
  },
};
