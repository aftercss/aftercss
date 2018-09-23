import fs from 'fs';
import path from 'path';

const writeFileP = fs.promises.writeFile;
const readFileP = fs.promises.readFile;

export class BaseFixture {
  constructor(currentDir) {
    this.currentDir = currentDir;
  }
  isString(s) {
    return Object.prototype.toString.call(s) === '[object String]';
  }
  async writeExpectFile(filename, content) {
    if (!(this.isString(filename) && this.isString(content))) {
      return;
    }
    const filePath = path.resolve(`${this.currentDir}/expect/${filename}`);
    return await writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
  }
  async writeActualFile(filename, content) {
    if (!(this.isString(filename) && this.isString(content))) {
      return;
    }
    const filePath = path.resolve(`${this.currentDir}/actual/${filename}`);
    return await writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
  }
  async readSrcDir(filename) {
    const filePath = path.resolve(`${this.currentDir}/src/${filename}`);
    return readFileP(filePath, {
      encoding: 'utf8',
      flag: 'r',
    });
  }
  async getAllDirs() {
    const files = await fs.promises.readdir(this.currentDir);
    const dirs = files.filter(async file => {
      const stat = await fs.promises.lstat(file);
      return stat.isDirectory();
    });
    return dirs;
  }
  async runTask() {}
}
