const BaseFixture = require('after-test').BaseFixture;
const CSSTokenizer = require('@aftercss/tokenizer');

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

const tokenFixture = new TokenFixture(path.resolve(__dirname, './hash-token'));

tokenFixture.runTask('Tokenizer', 'hash.json');
