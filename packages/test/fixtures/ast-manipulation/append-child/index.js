const { CSSParser, Comment } = require('@aftercss/parser');
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

class AstAppendChildFixture extends BaseFixture {
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
    ast.appendChildNode(new Comment('append child'));
    ast.appendChildNode([new Comment('append first child'), new Comment('append second child')]);
    await this.writeFile('actual', JSON.stringify(ast, null, 2), 'append-child.json');
  }
}

module.exports = {
  runTest() {
    const tokenFixture = new AstAppendChildFixture(__dirname);
    tokenFixture.runTask('ast-append-child');
  },
};
