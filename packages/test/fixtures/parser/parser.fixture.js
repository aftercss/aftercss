const CSSParser = require('@aftercss/parser').CSSParser;
const Tokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const BaseFixture = require('after-test').BaseFixture;
const AfterContext = require('@aftercss/shared').AfterContext;
const fs = require('fs');
const path = require('path');

class ParsreFixture extends BaseFixture {
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
    const res = JSON.stringify(parser.parseStyleSheet(), null, 2);
    await this.writeFile('actual', res, 'index.json');
  }
}

const parserDirs = fs.readdirSync(__dirname);

module.exports = {
  runTest() {
    parserDirs.forEach(item => {
      if (item !== 'parser.fixture.js') {
        const tokenFixture = new ParsreFixture(path.resolve(__dirname, item));
        tokenFixture.runTask(`${item}`);
      }
    });

    // const item = 'media-at-rule';
    // const tokenFixture = new ParsreFixture(path.resolve(__dirname, item));
    // tokenFixture.runTask(`${item}`);
  },
};

module.exports.runTest();
