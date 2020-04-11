const CSSParser = require('@aftercss/parser').CSSParser;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

export default class AstCloneFixture extends BaseFixture {
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

it('ast-clone', async () => {
  const tokenFixture = new AstAppendChildFixture(__dirname);
  await tokenFixture.runTask('ast-append-child');
});
