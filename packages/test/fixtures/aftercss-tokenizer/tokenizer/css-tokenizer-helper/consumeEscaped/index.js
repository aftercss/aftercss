const { BaseFixture } = require('after-test');
const { CSSTokenizer } = require('@aftercss/tokenizer');
const { AfterContext } = require('@aftercss/shared');
const consumeEscaped = require('@aftercss/tokenizer/lib/tokenizer/css-tokenizer-helper').helper.consumeEscaped;

class ConsumeEscapedFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    const res = consumeEscaped(tokenizer);
    await this.writeFile('actual', JSON.stringify(res, null, 2), 'escaped.json');
  }
}

const consumeEscapedFixture = new ConsumeEscapedFixture(__dirname);

it('helper escaped', async () => {
  await consumeEscapedFixture.runTask('css-tokenizer-helper-consume-escaped');
});
