import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileP = fs.promises.writeFile;
const readFileP = fs.promises.readFile;
const fileExistsP = promisify(fs.exists);

export class BaseFixture {
  constructor(currentDir) {
    this.currentDir = currentDir;
    this.srcDir = path.resolve(`${this.currentDir}/src/`);
    this.expectDir = path.resolve(`${this.currentDir}/expect/`);
    this.actualDir = path.resolve(`${this.currentDir}/actual/`);
    this.errorDir = path.resolve(`${this.currentDir}/error/`);
  }
  isString(s) {
    return Object.prototype.toString.call(s) === '[object String]';
  }
  async writeExpectFile(filename, content) {
    if (!(this.isString(filename) && this.isString(content))) {
      return;
    }
    const filePath = path.resolve(`${this.expectDir}/${filename}`);
    return await writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
  }
  async writeActualFile(filename, content) {
    if (!(this.isString(filename) && this.isString(content))) {
      return;
    }
    const filePath = path.resolve(`${this.actualDir}/${filename}`);
    return await writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
  }
  async writeErrorFile(content) {
    if (this.isString(content)) {
      return;
    }
    const filePath = path.resolve(`${this.errorDir}/index.json`);
    return await writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
  }
  async readSrcDir(filename) {
    const filePath = path.resolve(`${this.srcDir}/${filename}`);
    return readFileP(filePath, {
      encoding: 'utf8',
      flag: 'r',
    });
  }
  async readActualDir() {}
  async readExpectDir() {}
  async getAllDirs() {
    const files = await fs.promises.readdir(this.currentDir);
    const dirs = files.filter(async file => {
      const stat = await fs.promises.lstat(file);
      return stat.isDirectory();
    });
    return dirs;
  }
  async build() {
    throw new Error('error should be emitted');
  }
  async compareError(error) {
    const errorPath = path.resolve(`${this.currentDir}/error/index.json`);
    const errorFileExists = await fileExistsP(errorPath);
    if (!errorFileExists) {
      this.writeErrorFile(
        JSON.stringify(
          {
            message: error.message,
          },
          null,
          2,
        ),
      );
    }else{
      const errorJSON = require(errorPath);
      const errorMessage = errorJSON.message;
      
    }

    try {
      const errorJSON = require(errorPath);
    } catch (e) {
      throw new Error('');
    }
    const errorMessage = errorJSON.message;
    if (e.message.indexOf(errorMessage) >= 0) {
      return true;
    }
  }
  async runTask() {
    try {
      await this.build();
    } catch (e) {}
  }
}
