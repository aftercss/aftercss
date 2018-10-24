# after-css

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
  fixture.runTask(item=>{
    it(item.name,item=>fixture.build(item));
  });
})
```
