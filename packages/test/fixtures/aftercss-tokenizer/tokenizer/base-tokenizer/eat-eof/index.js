const { BaseFixture } = require('after-test');
const { CSSTokenizer } = require('@aftercss/tokenizer');
const { AfterContext } = require('@aftercss/shared');

class EatEofFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    tokenizer.eat('test', true);
  }
}

const eatEofFixture = new EatEofFixture(__dirname);

module.exports = {
  runTest() {
    eatEofFixture.runTask('base-tokenizer-eat-eof');
  },
};
