const Comment = require('@aftercss/parser').Comment;
const BaseFixture = require('after-test').BaseFixture;

export default class AstRemoveFixture extends BaseFixture {
  async build() {
    const index = new Comment('get-index').index();
    await this.writeFile('actual', JSON.stringify({ index }, null, 2), 'get-index.json');
  }
}
