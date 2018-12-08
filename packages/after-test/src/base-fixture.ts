import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const copyFileP = promisify(fs.copyFile);
const writeFileP = promisify(fs.writeFile);
const readFileP = promisify(fs.readFile);
const fileExistsP = promisify(fs.exists);

export class BaseFixture {
  private currentDir: string;
  private actualDir: string;
  private errorDir: string;
  private expectDir: string;
  private srcDir: string;

  constructor(currentDir) {
    this.currentDir = currentDir;
    this.actualDir = path.resolve(`${this.currentDir}/actual/`);
    this.errorDir = path.resolve(`${this.currentDir}/error/`);
    this.expectDir = path.resolve(`${this.currentDir}/expect/`);
    this.srcDir = path.resolve(`${this.currentDir}/src/`);
  }
  public isString(s): boolean {
    return Object.prototype.toString.call(s) === '[object String]';
  }

  public setCurrentDir(currentDir) {
    this.currentDir = currentDir;
  }

  public async writeFile(type, content, fileName) {
    const Types = ['actual', 'expect', 'error'];
    if (!(this.isString(fileName) && this.isString(content))) {
      throw new Error('[func writeFile]  Filename/Content must be a string.');
    }
    if (Types.indexOf(type) < 0) {
      throw new Error('[func writeFile]  Type is wrong.');
    }
    if (type === 'error') {
      fileName = 'index.json';
    }
    type = `${type}Dir`;
    const filePath = `${this[type]}/${fileName}`;
    if (!(await fileExistsP(this[type]))) {
      fs.mkdirSync(this[type]);
    }
    return writeFileP(filePath, content, { encoding: 'utf8', flag: 'w+' });
  }

  public async readFile(type, fileName) {
    const Types = ['actual', 'expect', 'error', 'src'];
    if (Types.indexOf(type) < 0) {
      throw new Error('[func readFile]  Type is wrong.');
    }
    type = `${type}Dir`;
    if (type === 'error') {
      fileName = 'index.json';
    }
    const filePath = `${this[type]}/${fileName}`;
    return readFileP(filePath, {
      encoding: 'utf8',
      flag: 'r',
    });
  }

  public async getAllDirs(dirPath: string) {
    const files = await promisify(fs.readdir)(dirPath);
    const dirs = files.filter(async file => {
      const stat = await promisify(fs.lstat)(`${dirPath}/${file}`);
      return stat.isDirectory();
    });
    return dirs;
  }

  public getFilelist(filePath: string) {
    const items = fs.readdirSync(filePath);
    const files = items.filter(item => {
      const stat = fs.lstatSync(`${filePath}/${item}`);
      return stat.isFile();
    });
    return files;
  }

  public async build(): Promise<string> {
    throw new Error('error should be emitted');
  }

  public async compareError(error) {
    const errorPath = path.resolve(`${this.errorDir}/index.json`);
    const errorFileExists = await fileExistsP(errorPath);
    const message = error.message;
    if (!errorFileExists) {
      await this.writeFile(
        'error',
        JSON.stringify(
          {
            message: [message],
          },
          null,
          2,
        ),
        '',
      );
    } else {
      const errorJSON = require(errorPath);
      const errorMessage = errorJSON.message;
      if (errorMessage.indexOf(message) < 0) {
        throw error;
      }
    }
  }

  public makeDiff(taskName: string) {
    it(taskName, async () => {
      let e = null;
      try {
        await this.build();
      } catch (err) {
        e = err;
        await this.compareError(e);
      }
      await this.compareDir();
    });
  }

  public async compareDir() {
    const expectFiles = this.getFilelist(this.expectDir);
    if (expectFiles.length > 0) {
      const actualFiles = this.getFilelist(this.actualDir);
      assert.deepEqual(actualFiles, expectFiles);
      for (const file of actualFiles) {
        const ac = await readFileP(path.resolve(this.actualDir, file));
        const ex = await readFileP(path.resolve(this.expectDir, file));
        assert.equal(ac.toString(), ex.toString());
      }
      return;
    } else {
      await this.moveActualToExpect();
      assert(true);
    }
  }

  public async moveActualToExpect() {
    const files = this.getFilelist(this.actualDir);
    const promises = [];
    files.forEach(file => {
      promises.push(copyFileP(`${this.actualDir}/${file}`, `${this.expectDir}/${file}`));
    });
    return Promise.all(promises);
  }

  public runTask(taskName: string) {
    this.makeDiff(taskName);
  }
}
