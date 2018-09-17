import { TokenFactory, TokenType } from './token';

class Tokenizer {
  public content: string = '';
  private end: number = this.content.length;
  private start: number = 0;
  private current: number = 0;
  public constructor(content: string) {
    this.content = content;
    this.end = this.content.length;
  }
  /**
   * readUntil `s` show up
   * @param s
   */
  public readUntil(s: string) {
    const nextPosition = this.content.indexOf(s, this.current);
    const value = s.slice(this.current, nextPosition);
    this.current = nextPosition;
    return value;
  }
  /**
   * eat
   */
  public eat(str?: string, error: boolean = false) {
    if (!str) {
      return this.content.charAt(this.current++);
    }
    const len = str.length;
    const slice = this.content.slice(this.current, this.current + len);
    if (str === slice) {
      return slice;
    } else {
      if (error !== false) {
        throw new Error(`expecting ${str} but get ${slice}`);
      }
    }
  }
  /**
   * pick a char
   */
  public pick() {
    return this.content.charAt(this.current);
  }
  /**
   * CSS3 defined input process https://www.w3.org/TR/css-syntax-3/#input-preprocessing
   * preprocess CSSChar
   */
  public preprocess(): string {
    const char = this.eat();
    if (char === '\u000C' || char === '\u000D') {
      return '\u000A';
    }
    if (char === '\u000A' && this.pick() === '\u000D') {
      // eat that pick
      this.eat();
      return '\u000A';
    }
    if (char === '\u0000') {
      return '\uFFFD';
    }
  }
  public readChar() {
    return this.preprocess();
  }
  /**
   * 生成Token用的
   */
  public getToken() {
    if (this.current >= this.end) {
      return TokenFactory(TokenType.EOF);
    }
    const char = this.readChar();
    /**
     * https://www.w3.org/TR/css-syntax-3/#comment-diagram
     */
    if (char === '/') {
      if (this.pick() === '*') {
        this.eat('*');
        return TokenFactory(TokenType.COMMENT, '');
      }
    }
  }
}
