const { BaseFixture } = require('after-test');
const { CSSTokenizer } = require('@aftercss/tokenizer');
const { AfterContext } = require('@aftercss/shared');

class AllowWhiteFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    const res = tokenizer.allowWhitespace();
    await this.writeFile('actual', JSON.stringify(res, null, 2), 'allow-whitespace.json');
  }
}

const allowWhiteFixturealltokensFixture = new AllowWhiteFixture(__dirname);

module.exports = {
  runTest() {
    allowWhiteFixturealltokensFixture.runTask('base-tokenizer-allow-whitespace');
  },
};
