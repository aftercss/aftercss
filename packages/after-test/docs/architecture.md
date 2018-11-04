
# Architecture

> 基于mocha测试框架


## 结构
测试框架包括两个部分：
* 测试流程 - base-framework/base-fixture.js
* 测试用例 - fixtures

### 测试流程
base-fixture规定了测试流程，测试流程如下：

![测试流程](./assets/flow.png)

此外，base-fixture还实现了常用工具函数：
* 字符串检查 - isString(str)  
	* str < Object >  对象
	* Returns: 布尔值。str 为字符串时返回 `true`， 否则返回 `false`

* 文件写入 - wirteFile(type, content, filename)
	* type < String >  type可取值 ['actual', 'expect', 'error']
	* filename < String > 待写入文件文件名。当type为error时，文件名会强制变更为index.json
	* content  < String > 待写入文件内容
	* Returns: < Promise >

* 文件读取 - readFile(type, filename)
	* type < String >  type可取值 ['actual', 'expect', 'error']
	* filename < String > 待读取文件名。当type为error时，文件名会强制变更为index.json
	* Returns: < Promise >

* 获取当前文件夹下所有目录 - getAllDirs()
	* Returns: < Promise >


### 测试用例
测试用例统一放在fixture文件夹下，每添加一个测试用例，在fixture下新建对应的文件夹。

* 测试用例文件结构：

```
test-example
	├── actual  // 存放测试功能输出文件 
	├── error   // 存放错误信息文件
	├── expect	// 存放预期结果文件
	└── src     // 存放测试源文件
```

* 测试用例编写

``` javascript

import { BaseFixture } from 'path/to/base-framework/base-fixture';
import assert from 'assert'; //引入 mocha

class TestExample extends BaseFixture{
  async build(){
	  // 测试细节
  }
}

describe('test-example',()=>{
  const textExample = new TestExample(__dirname);
  textExample.runTask(); //运行测试
})

```



