const BaseFixture = require('after-test').BaseFixture;
const Tokenizer = require('@aftercss/tokenizer').Tokenizer;

const path = require('path');

class TokenFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const tokenizer = new Tokenizer(content);
    const token = tokenizer.nextToken();
    return token.toString();
  }
}

const tokenFixture = new TokenFixture(path.resolve(__dirname, './string-token'));

tokenFixture.runTask('Tokenizer', 'stringToken.json');
