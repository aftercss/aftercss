const { BaseFixture } = require('after-test');
const { CSSTokenizer } = require('@aftercss/tokenizer');
const { AfterContext } = require('@aftercss/shared');

class ReadUntilFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    tokenizer.readUntil(/\*\//);
  }
}

const readUntilFixture = new ReadUntilFixture(__dirname);

module.exports = {
  runTest() {
    readUntilFixture.runTask('base-tokenizer-read-until');
  },
};
