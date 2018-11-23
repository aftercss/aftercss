const BaseFixture = require('after-test/lib/base-fixture').BaseFixture;

class ExampleFixture extends BaseFixture {
  async build() {
    const content = await this.readFile('src', 'index.txt');
    return content.toUpperCase();
  }
}

const exampleFixture = new ExampleFixture(__dirname);

module.exports = {
  runTest() {
    exampleFixture.runTask('test', 'after-test.txt');
  },
};
