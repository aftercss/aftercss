const WhiteSpaceRegex = /\s+/;

export class BaseTokenizer {
  public content: string = '';
  private end: number = this.content.length;
  private start: number = 0;
  private current: number = 0;

  public constructor(content: string) {
    this.content = content;
    this.end = this.content.length;
  }

  public error(message: string) {
    throw new Error(message);
  }
  /**
   * readUntil `s` show up
   * @param s
   */
  public readUntil(pattern: RegExp) {
    if (this.current >= this.content.length) {
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

    this.current = this.content.length;
    return this.content.slice(start);
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
  public isEof() {
    return this.current >= this.end;
  }

  public step(num: number = 1) {
    this.current += num;
  }

  /**
   * eat
   */
  public eat(str: string, required: boolean = false, message?: string) {
    if (this.match(str)) {
      this.current += str.length;
      return true;
    }

    if (required) {
      this.error(
        JSON.stringify({
          code: `unexpected-${this.current === this.content.length ? 'eof' : 'token'}`,
          message: message || `Expected ${str}`,
        }),
      );
    }
    return false;
  }

  public allowWhitespace() {
    while (this.current < this.content.length && WhiteSpaceRegex.test(this.content[this.current])) {
      this.current++;
    }
  }
  /**
   * pick a char
   */
  public pick(cnt = 0) {
    return this.content.charAt(this.current + cnt);
  }
  /**
   * CSS3 defined input process https://www.w3.org/TR/css-syntax-3/#input-preprocessing
   * preprocess CSSChar
   */
  public preprocess() {
    // TODO: bad performance. fixable in stream.
    // TODO: and this hurts sourcemap.
    this.content.replace('\u000A\u000D', '\u000A');
    this.content.replace('\u000C', '\u000A');
    this.content.replace('\u000D', '\u000A');
    this.content.replace('\u0000', '\uFFFD');
  }
}
