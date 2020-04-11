const { BaseFixture } = require('after-test');
const { CSSTokenizer } = require('@aftercss/tokenizer');
const { AfterContext } = require('@aftercss/shared');

class EatFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.css');
    const context = new AfterContext({
      fileContent: content,
    });
    const tokenizer = new CSSTokenizer(context);
    tokenizer.eat('test', true);
  }
}

const eatFixture = new EatFixture(__dirname);

it('eat', async () => {
  await eatFixture.runTask('base-tokenizer-eat');
});
