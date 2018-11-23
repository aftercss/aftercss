# after-css

[![Build Status](https://travis-ci.com/aftercss/aftercss.svg?branch=dev-spades)](https://travis-ci.com/aftercss/aftercss)
[![codecov](https://codecov.io/gh/aftercss/aftercss/branch/dev-spades/graph/badge.svg)](https://codecov.io/gh/aftercss/aftercss)

---

implement of [CSS3](https://www.w3.org/TR/css-syntax-3/) in TypeScript.

## test-framework

```javascript
class TokenFixture extends BaseFixture{
  async build(taskName){
    this.srcDir// acess to src dir
    await this.readSrcFile(filename);
    // User do their work.
    await this.writeActualFile(filename, content);
  }
}
describe('test',function(){
  const fixture = new TokenFixture(__dirname);
  fixture.runTask(async item=>{
    it(item.name,item=>fixture.build(item));
  });
})
// 在每个runtask之后要处理一下actualfile和expectfile比较的问题，根据比较结果决定当前用例是否通过。
```
