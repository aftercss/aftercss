import * as assert from 'assert';
import * as fs from 'fs';
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

  public async writeFile(type, content, fileName) {
    const Types = ['actual', 'expect', 'error'];
    if (!(this.isString(fileName) && this.isString(content))) {
      return Promise.reject('Filename/Content must be a string.');
    }
    if (Types.indexOf(type) < 0) {
      return Promise.reject('Type is wrong.');
    }
    if (type === 'error') {
      fileName = 'index.json';
    }
    type = `${type}Dir`;
    const filePath = `${this[type]}/${fileName}`;
    return writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
  }

  public async readFile(type, fileName) {
    const Types = ['actual', 'expect', 'error', 'src'];
    if (Types.indexOf(type) < 0) {
      return Promise.reject('Type is wrong.');
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

  public async build(source: string): Promise<string> {
    throw new Error('error should be emitted');
  }

  public async compareError(error) {
    const errorPath = path.resolve(`${this.errorDir}/index.json`);
    const errorFileExists = await fileExistsP(errorPath);
    if (!errorFileExists) {
      await this.writeFile(
        'error',
        JSON.stringify(
          {
            message: [error.message],
          },
          null,
          2,
        ),
        '',
      );
    } else {
      const errorJSON = require(errorPath);
      const errorMessage = errorJSON.message;
      if (errorMessage.indexOf(error.message) < 0) {
        errorMessage.push(error.message);
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
  }

  public async generateActualFile(fileName): Promise<string> {
    const source = await this.readFile('src', fileName);
    const output = await this.build(source);
    await this.writeFile('actual', output, fileName);
    return output;
  }

  public makeDiff(fileName: string) {
    const expectFilePath = `${this.expectDir}/${fileName}`;
    const expectFileExists = fs.existsSync(expectFilePath);
    if (!expectFileExists) {
      it(fileName, async () => {
        try {
          const actualContent = await this.generateActualFile(fileName);
          await this.writeFile('expect', actualContent, fileName);
        } catch (err) {
          this.compareError(err);
        }
        assert.equal(1, 1);
      });
    } else {
      it(fileName, async () => {
        let actualContent = '';
        let expectContent = '';
        try {
          actualContent = await this.generateActualFile(fileName);
          expectContent = await this.readFile('expect', fileName);
        } catch (err) {
          this.compareError(err);
        }
        assert.equal(actualContent, expectContent);
      });
    }
  }

  public runTask(taskName: string) {
    describe(taskName, () => {
      const fileList = this.getFilelist(this.srcDir);
      fileList.forEach(fileName => {
        this.makeDiff(fileName);
      });
    });
  }
}
