import assert from 'assert';
import jsDiff from 'diff'
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileP = promisify(fs.writeFile);
const readFileP = promisify(fs.readFile);
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

    async writeFile(type, content, filename) {
        const Types = ['actual', 'except', 'error'];
        if (!(this.isString(filename) && this.isString(content))) {
            return Promise.reject('Filename/Content must be a string.');
        }
        if (Types.indexOf(type) < 0) {
            return Promise.reject('Type is wrong.');
        }
        if (type == 'error') fileName = 'index.json';
        type = `${type}Dir`;
        const filePath = `${this[type]}/${filename}`;
        return await writeFileP(filePath, content, { encoding: 'utf8', flag: 'w' });
    }

    async readFile(type, filename) {
        const Types = ['actual', 'except', 'error'];
        if (Types.indexOf(type) < 0) {
            return Promise.reject('Type is wrong.');
        }
        type = `${typeDir}`;
        if (type == 'error') filename = 'index.json';

        const filePath = path.resolve(`${this.srcDir}/${filename}`);
        return readFileP(filePath, {
            encoding: 'utf8',
            flag: 'r',
        });
    }

    async getAllDirs() {
        const files = await promisify(fs.readdir)(this.currentDir);
        const dirs = files.filter(async file => {
            const stat = await promisify(fs.lstat(file));
            return stat.isDirectory();
        });
        return dirs;
    }

    async getAllFiles(path = this.actualDir) {
        const items = await promisify(fs.readdir(path));
        const files = items.filter(async item => {
            const stat = await promisify(fs.lstat(item));
            return stat.isFile()
        })
        return files
    }


    async build() {
        // 读取 src
        // 生成 actual
        throw new Error('error should be emitted');
    }

    async compareError(error) {
        const errorPath = path.resolve(`${this.errorDir}/index.json`);
        const errorFileExists = await fileExistsP(errorPath);
        if (!errorFileExists) {
            await this.writeFile('error',
                JSON.stringify({
                        message: [error.message],
                    },
                    null,
                    2
                )
            );
        } else {
            const errorJSON = require(errorPath);
            const errorMessage = errorJSON.message;
            if (errorMessage.indexOf(error.message) < 0) {
                errorMessage.push(error.message);
                await this.writeFile('error',
                    JSON.stringify({
                            message: errorMessage,
                        },
                        null,
                        2
                    ))
            }
        }
    }


    async makeDiff(filename) {
        const actualFilePath = `${this.actualDir}/${filename}`;
        const exceptFilePath = `${this.expectDir}/${filename}`;
        const exceptFileExists = await fileExistsP(exceptFilePath);
        if (!exceptFileExists) {
            fs.writeFileSync(exceptFilePath, fs.readFileSync(actualFilePath))
            return true;
        }
        const actualContent = await this.readFileP('actual', filename);
        const exceptContent = await this.readFileP('expect', filename);

        const patch = jsDiff.structuredPatch('', '', actualContent, exceptContent, '', '');
        if (patch.length == 0) return true;

        let lines = patch.hunks[0].lines
        lines = lines.filter((line) => {
            return line.trim() !== '' && line !== '\\ No newline at end of file';
        })
        const ret = lines.join('\n');
        await this.writeFileP('acutal', filename, ret);
        return false;
    }


    async runTask(name, intro) {
        try {
            await this.build();
            const files = await this.getAllFiles();
            const state = 'succeed';
            const self = this;
            files.forEach(file => {
                if (!self.makeDiff(file)) state = 'fail'
            });
            describe(name, () => {
                it(intro, () => {
                    assert.equal(state === 'success');
                })
            })

        } catch (err) {
            await this.compareError(err);
        }
    }
}