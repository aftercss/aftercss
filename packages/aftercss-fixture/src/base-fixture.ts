import * as assert from 'assert';
import * as jsDiff from 'diff';
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
    const Types = ['actual', 'except', 'error'];
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
    const Types = ['actual', 'except', 'error', 'src'];
    if (Types.indexOf(type) < 0) {
      return Promise.reject('Type is wrong.');
    }
    type = `${type}Dir`;
    if (type === 'error') {
      fileName = 'index.json';
    }
    const filePath = path.resolve(`${this.srcDir}/${fileName}`);
    return readFileP(filePath, {
      encoding: 'utf8',
      flag: 'r',
    });
  }

  public async getAllDirs() {
    const files = await promisify(fs.readdir)(this.currentDir);
    const dirs = files.filter(async file => {
      const stat = await promisify(fs.lstat)(file);
      return stat.isDirectory();
    });
    return dirs;
  }

  public async getFilelist(filePath: string) {
    const items = await promisify(fs.readdir)(filePath);
    const files = items.filter(async item => {
      const stat = await promisify(fs.lstat)(item);
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
    await this.writeFile('actual', fileName, output);
    return output;
  }

  public async makeDiff(fileName: string): Promise<void> {
    const expectFilePath = `${this.expectDir}/${fileName}`;
    const expectFileExists = await fileExistsP(expectFilePath);
    const actualContent = await this.generateActualFile(fileName);

    if (!expectFileExists) {
      await this.writeFile('expect', fileName, actualContent);
      return;
    }
    const expectContent = await this.readFile('expect', fileName);

    it(fileName, () => {
      assert.equal(actualContent, expectContent);
    });
  }

  public async runTask(taskName: string) {
    try {
      const fileList = await this.getFilelist(this.srcDir);
      describe(taskName, () => {
        fileList.forEach(async fileName => {
          await this.makeDiff(fileName);
        });
      });
    } catch (err) {
      await this.compareError(err);
    }
  }
}
