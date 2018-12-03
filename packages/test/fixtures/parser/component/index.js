const Parser = require('@aftercss/parser').Parser;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;

class ComponentFixture extends BaseFixture {
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
      if (token.type === 'EOF') {
        break;
      }
      tokens.push(token);
    }
    const parser = new Parser(tokens);
    const res = JSON.stringify(parser.consumeComponent(), null, 2);
    await this.writeFile('actual', res, 'index.json');
  }
}

const componentFixture = new ComponentFixture(__dirname);

module.exports = {
  runTest() {
    componentFixture.runTask('component');
  },
};

