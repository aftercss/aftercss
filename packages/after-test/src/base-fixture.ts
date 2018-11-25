import * as assert from 'assert';
import copyDir = require('copy-dir');
import * as fs from 'fs';
import glob = require('glob');
import * as path from 'path';
import { promisify } from 'util';

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

  public async getAllDirs() {
    const files = await promisify(fs.readdir)(this.currentDir);
    const dirs = files.filter(async file => {
      const stat = await promisify(fs.lstat)(`${this.currentDir}/${file}`);
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
    const message = `${new Date().toUTCString()} - ${error.message}`;
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
      errorMessage.push(message);
      await this.writeFile(
        'error',
        JSON.stringify(
          {
            message: errorMessage,
          },
          null,
          2,
        ),
        '',
      );
    }
  }

  public async generateActualFile(): Promise<string> {
    const output = await this.build();
    // await this.writeFile('actual', output, fileName);
    return output;
  }

  public makeDiff(taskName: string) {
    it(taskName, async () => {
      let e = null;
      try {
        await this.generateActualFile();
      } catch (err) {
        e = err;
        throw err;
      }
      if (e === null) {
        await this.compareDir();
      } else {
        await this.compareError(e);
      }
    });
  }

  public async compareDir() {
    const expectExists = await fileExistsP(this.expectDir);
    let expectFiles = glob.sync(path.resolve(this.expectDir, '**/*'));
    if (expectExists && expectFiles.length > 0) {
      let actualFiles = glob.sync(path.resolve(this.actualDir, '**/*'));
      actualFiles = actualFiles.map(file => {
        return path.relative(this.actualDir, file);
      });
      expectFiles = expectFiles.map(file => {
        return path.relative(this.expectDir, file);
      });
      assert.deepEqual(actualFiles, expectFiles);
      for (const file of actualFiles) {
        const ac = await readFileP(path.resolve(this.actualDir, file));
        const ex = await readFileP(path.resolve(this.expectDir, file));
        assert.equal(ac.toString(), ex.toString());
      }
      return;
    } else {
      this.moveActualToExpect();
      assert(true);
    }
  }

  public moveActualToExpect() {
    // TODO:重新实现一下这个方法
    copyDir(this.actualDir, this.expectDir, () => {
      /** */
    });
  }

  public runTask(taskName: string) {
    this.makeDiff(taskName);
  }
}
