const BaseFixture = require('after-test').BaseFixture;
const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const AfterContext = require('@aftercss/shared').AfterContext;
const fs = require('fs');

const path = require('path');

class TokenFixture extends BaseFixture {
  constructor(path, currentTest) {
    super(path);
    this.currentTest = currentTest;
  }
  async build() {
    const content = await this.readFile('src', 'index.css');
    const tokenizer = new CSSTokenizer(
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
      if (token.type === 'WHITESPACE' && this.currentTest !== 'whitespace-token') {
        continue;
      }
      tokens.push(token);
    }

    await this.writeFile('actual', JSON.stringify(tokens, null, 2), 'index.json');
  }
}

const tokenDirs = fs.readdirSync(__dirname).filter($ => $ !== 'index.js');

describe('token', () => {
  for (const item of tokenDirs) {
    it(item, async () => {
      const tokenFixture = new TokenFixture(path.resolve(__dirname, item), item);
      await tokenFixture.runTask(`${item}`);
    });
  }
});
