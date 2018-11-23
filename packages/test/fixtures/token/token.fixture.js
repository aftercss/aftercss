const BaseFixture = require('after-test').BaseFixture;
const CSSTokenizer = require('@aftercss/tokenizer').CSSTokenizer;
const fs = require('fs');

const path = require('path');

class TokenFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const tokenizer = new CSSTokenizer(content);
    tokenizer.preprocess();
    const token = tokenizer.nextToken();
    return token.toString();
  }
}

const tokenDirs = fs.readdirSync(__dirname);

module.exports = {
  runTest() {
    tokenDirs.forEach(item => {
      if (item !== 'token.fixture.js') {
        const tokenFixture = new TokenFixture(path.resolve(__dirname, item));
        tokenFixture.runTask('Tokenizer', `${item}.json`);
      }
    });
  },
};

