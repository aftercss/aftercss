import { TokenFactory, TokenType } from './token';

const WhiteSpaceRegex = /\s+/;

export class Tokenizer {
  public content: string = '';
  private end: number = this.content.length;
  private start: number = 0;
  private current: number = 0;
  private helper: {
    [index: string]: () => any;
  } = {
    consumeBadURL() {
      let badurlContent = '';
      while (!(this.current >= this.end) && !this.eat(')')) {
        // consume a valid escape
        if (this.eat('\\') && this.pick() !== '\n') {
          badurlContent += this.helper.consumeEscaped.apply(this);
        } else {
          badurlContent += this.pick();
          this.current++;
        }
      }
      return badurlContent;
    },
    consumeEscaped() {
      // reverse solidus followed by a non-newline
      // https://www.w3.org/TR/css-syntax-3/#consume-an-escaped-code-point
      // assume that the U+005C REVERSE SOLIDUS (\) has already been consumed
      let escapedContent = '';
      if (!this.eat('\n')) {
        if (this.current >= this.end) {
          escapedContent = '\ufffd';
        }
        const hex = this.matchReg(/[0-9a-fA-F]{1,6}/);
        if (hex) {
          const hexToDec = parseInt(hex, 16);
          if (hexToDec === 0 || hexToDec >= 0x10ffff || (hexToDec >= 0xd800 && hexToDec <= 0xdfff)) {
            escapedContent += '\ufffd';
          } else {
            escapedContent += String.fromCodePoint(hexToDec); // a puzzle here
          }
          this.current += hex.length;
          this.eat(' ');
        } else {
          escapedContent += this.pick();
          this.current++;
        }
      }
      return escapedContent;
    },
  };
  private generateToken: {
    [index: string]: () => any;
  } = {
    atkeywordToken() {
      /**
       * at-key-word token
       * https://www.w3.org/TR/css-syntax-3/#at-keyword-token-diagram
       */
      if (this.eat('@')) {
        return TokenFactory(TokenType.ATKEYWORD, '@');
      }
    },
    commentToken() {
      /**
       * comment token
       * https://www.w3.org/TR/css-syntax-3/#comment-diagram
       */
      if (this.eat('/*')) {
        const commentContent = this.readUntil(/\*\//);
        return TokenFactory(TokenType.COMMENT, commentContent);
      }
    },
    eofToken() {
      if (this.current >= this.end) {
        return TokenFactory(TokenType.EOF);
      }
    },
    newlineToken() {
      /**
       * new line token
       * https://www.w3.org/TR/css-syntax-3/#newline
       * transform ['\r\n' | '\r' | '\f'] into '\n' when preprocessing
       * need to check '\n' only
       */
      // const newlineList = ['\r\n', '\n', '\r', '\f'];
      // for (const item of newlineList) {
      //   if (this.eat(item)) {
      //     return TokenFactory(TokenType.NEWLINE, item);
      //   }
      // }
      if (this.eat('\n')) {
        return TokenFactory(TokenType.NEWLINE, '\n');
      }
    },
    stringToken() {
      /**
       * string token  || bad string token
       * https://www.w3.org/TR/css-syntax-3/#string-token-diagram
       */

      if (this.eat("'") || this.eat('"')) {
        const quote = this.pick(this.current - 1);
        let stringContent = '';
        while (!this.eat(quote)) {
          if (this.current >= this.end) {
            return TokenFactory(TokenType.STRING, stringContent);
          } else if (this.eat('\\')) {
            stringContent += this.helper.consumeEscaped.apply(this);
          } else if (this.eat('\n')) {
            return TokenFactory(TokenType.BAD_STRING, `${stringContent}\n`);
          } else {
            stringContent += this.pick();
            this.current++;
          }
        }
        return TokenFactory(TokenType.STRING, stringContent);
      }
    },
    urlToken() {
      /**
       * url token
       * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
       */
      if (this.eat('url(')) {
        // consume as much whitespace as possible
        this.allowWhitespace();
        let urlContent = '';
        // string token
        if (this.pick() === "'" || this.pick() === '"') {
          const stringToken = this.generateToken.stringToken.apply(this);
          if (stringToken) {
            urlContent = stringToken.raw;
            // bad url token
            if (stringToken.type === 'BAD_STRING') {
              // consume the remnants of a bad url
              urlContent += this.helper.consumeBadURL.apply(this);
              return TokenFactory(TokenType.BAD_URL, urlContent);
            }
            this.allowWhitespace();
            if (this.eat(')') || this.current >= this.end) {
              return TokenFactory(TokenType.URL, urlContent);
            }
            urlContent += ' ';
            urlContent += this.helper.consumeBadURL.apply(this);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
        }
        while (!this.eat(')')) {
          if (this.current >= this.end) {
            return TokenFactory(TokenType.URL, urlContent);
          }
          // non-printalbe code point
          if (this.eat('(')) {
            urlContent += '(';
            urlContent += this.helper.consumeBadURL.apply(this);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
          // eacape code point
          if (this.eat('\\')) {
            // invalid escape code point
            if (this.eat('\n')) {
              urlContent += '\n';
              urlContent += this.helper.consumeBadURL.apply(this);
              return TokenFactory(TokenType.BAD_URL, urlContent);
            }
            urlContent += this.helper.consumeEscaped.apply(this);
            continue;
          }
          if (this.eat(' ')) {
            this.allowWhitespace();
            if (this.eat(')')) {
              return TokenFactory(TokenType.URL, urlContent);
            }
            urlContent += ' ';
            urlContent += this.helper.consumeBadURL.apply(this);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
          // anything else
          urlContent += this.pick();
          this.current++;
        }
        return TokenFactory(TokenType.URL, urlContent);
      }
    },
  };

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
  public pick(index = this.current) {
    return this.content.charAt(index);
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

  /**
   * 生成Token用的
   */
  public nextToken() {
    for (const tokenGenerator in this.generateToken) {
      if (this.generateToken.hasOwnProperty(tokenGenerator)) {
        const token = this.generateToken[tokenGenerator].apply(this);
        if (token) {
          return token;
        }
      }
    }
  }
}
