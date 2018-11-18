// const WhiteSpaceRegex = /[\s\t\n]+/;

export class BaseTokenizer {
  public content: string = '';
  private end: number = 0;
  private current: number = 0;

  public constructor(content: string) {
    this.content = content;
    this.end = this.content.length;
  }

  public allowWhitespace() {
    if (!this.isEof()) {
      this.readUntil(/[^\s\t\n]/);
    }
  }

  /**
   * eat
   */
  public eat(str: string, required: boolean = false, message?: string) {
    if (str.length === 1) {
      if (this.pick() === str) {
        this.step();
        return true;
      }
    } else {
      if (this.match(str)) {
        this.step(str.length);
        return true;
      }
    }

    if (required) {
      this.error(
        JSON.stringify({
          code: `unexpected-${this.current === this.end ? 'eof' : 'token'}`,
          message: message || `Expected ${str}`,
        }),
      );
    }
    return false;
  }

  public error(message: string) {
    throw new Error(message);
  }

  public isEof() {
    return this.current >= this.end;
  }

  /**
   * match
   * @param str
   */
  public match(str: string) {
    return this.content.slice(this.current, this.current + str.length) === str;
  }

  /**
   * matchReg
   * @param pattern
   */

  public matchReg(pattern: RegExp): string {
    const match = pattern.exec(this.content.slice(this.current));
    if (!match || match.index !== 0) {
      return null;
    }
    return match[0];
  }

  /**
   * pick a char
   */
  public pick(cnt = 0) {
    return this.content.charAt(this.current + cnt);
  }
  /**
   * readUntil `s` show up
   * @param s
   */
  public readUntil(pattern: RegExp) {
    if (this.current >= this.end) {
      this.error(
        JSON.stringify({
          code: `unexpected-eof`,
          message: 'Unexpected end of input',
        }),
      );
    }
    const start = this.current;
    const match = pattern.exec(this.content.slice(start));
    if (match) {
      this.current = start + match.index;
      return this.content.slice(start, this.current);
    }

    this.current = this.end;
    return this.content.slice(start);
  }

  public step(num: number = 1) {
    this.current += num;
  }
}
