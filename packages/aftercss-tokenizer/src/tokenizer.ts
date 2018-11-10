import { TokenFactory, TokenType } from './token';

const WhiteSpaceRegex = /\s+/;
const helper: {
  [index: string]: (tokenizer: Tokenizer) => any;
} = {
  consumeBadURL(tokenizer: Tokenizer) {
    let badurlContent = '';
    while (!tokenizer.isEof() && !tokenizer.eat(')')) {
      // consume a valid escape
      if (tokenizer.eat('\\') && tokenizer.pick() !== '\n') {
        badurlContent += this.consumeEscaped(tokenizer);
      } else {
        badurlContent += tokenizer.pick();
        tokenizer.step();
      }
    }
    return badurlContent;
  },
  consumeEscaped(tokenizer: Tokenizer) {
    // reverse solidus followed by a non-newline
    // https://www.w3.org/TR/css-syntax-3/#consume-an-escaped-code-point
    // assume that the U+005C REVERSE SOLIDUS (\) has already been consumed
    let escapedContent = '';
    if (!tokenizer.eat('\n')) {
      if (tokenizer.isEof()) {
        escapedContent = '\ufffd';
      }
      const hex = tokenizer.matchReg(/[0-9a-fA-F]{1,6}/);
      if (hex) {
        const hexToDec = parseInt(hex, 16);
        if (hexToDec === 0 || hexToDec >= 0x10ffff || (hexToDec >= 0xd800 && hexToDec <= 0xdfff)) {
          escapedContent += '\ufffd';
        } else {
          escapedContent += String.fromCodePoint(hexToDec); // a puzzle here
        }
        tokenizer.step(hex.length);
        tokenizer.eat(' ');
      } else {
        escapedContent += tokenizer.pick();
        tokenizer.step();
      }
    }
    return escapedContent;
  },
};
const generateToken: {
  [index: string]: (tokenizer: Tokenizer) => any;
} = {
  atkeywordToken(tokenizer: Tokenizer) {
    /**
     * at-key-word token
     * https://www.w3.org/TR/css-syntax-3/#at-keyword-token-diagram
     */
    if (tokenizer.eat('@')) {
      return TokenFactory(TokenType.ATKEYWORD, '@');
    }
  },
  commentToken(tokenizer: Tokenizer) {
    /**
     * comment token
     * https://www.w3.org/TR/css-syntax-3/#comment-diagram
     */
    if (tokenizer.eat('/*')) {
      const commentContent = tokenizer.readUntil(/\*\//);
      return TokenFactory(TokenType.COMMENT, commentContent);
    }
  },
  eofToken(tokenizer: Tokenizer) {
    if (tokenizer.isEof()) {
      return TokenFactory(TokenType.EOF);
    }
  },
  newlineToken(tokenizer: Tokenizer) {
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
    if (tokenizer.eat('\n')) {
      return TokenFactory(TokenType.NEWLINE, '\n');
    }
  },
  stringToken(tokenizer: Tokenizer) {
    /**
     * string token  || bad string token
     * https://www.w3.org/TR/css-syntax-3/#string-token-diagram
     */

    if (tokenizer.eat("'") || tokenizer.eat('"')) {
      const quote = tokenizer.pick(-1);
      let stringContent = '';
      while (!tokenizer.eat(quote)) {
        if (tokenizer.isEof()) {
          return TokenFactory(TokenType.STRING, stringContent);
        } else if (tokenizer.eat('\\')) {
          stringContent += helper.consumeEscaped(tokenizer);
        } else if (tokenizer.eat('\n')) {
          return TokenFactory(TokenType.BAD_STRING, `${stringContent}\n`);
        } else {
          stringContent += tokenizer.pick();
          tokenizer.step();
        }
      }
      return TokenFactory(TokenType.STRING, stringContent);
    }
  },
  urlToken(tokenizer: Tokenizer) {
    /**
     * url token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
     */
    if (tokenizer.eat('url(')) {
      // consume as much whitespace as possible
      tokenizer.allowWhitespace();
      let urlContent = '';
      // string token
      if (tokenizer.pick() === "'" || tokenizer.pick() === '"') {
        const stringToken = this.stringToken(tokenizer);
        if (stringToken) {
          urlContent = stringToken.raw;
          // bad url token
          if (stringToken.type === 'BAD_STRING') {
            // consume the remnants of a bad url
            urlContent += helper.consumeBadURL(tokenizer);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
          tokenizer.allowWhitespace();
          if (tokenizer.eat(')') || tokenizer.isEof()) {
            return TokenFactory(TokenType.URL, urlContent);
          }
          urlContent += ' ';
          urlContent += helper.consumeBadURL(tokenizer);
          return TokenFactory(TokenType.BAD_URL, urlContent);
        }
      }
      while (!tokenizer.eat(')')) {
        if (tokenizer.isEof()) {
          return TokenFactory(TokenType.URL, urlContent);
        }
        // non-printalbe code point
        if (tokenizer.eat('(')) {
          urlContent += '(';
          urlContent += helper.consumeBadURL(tokenizer);
          return TokenFactory(TokenType.BAD_URL, urlContent);
        }
        // eacape code point
        if (tokenizer.eat('\\')) {
          // invalid escape code point
          if (tokenizer.eat('\n')) {
            urlContent += '\n';
            urlContent += helper.consumeBadURL(tokenizer);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
          urlContent += helper.consumeEscaped(tokenizer);
          continue;
        }
        if (tokenizer.eat(' ')) {
          tokenizer.allowWhitespace();
          if (tokenizer.eat(')')) {
            return TokenFactory(TokenType.URL, urlContent);
          }
          urlContent += ' ';
          urlContent += helper.consumeBadURL(tokenizer);
          return TokenFactory(TokenType.BAD_URL, urlContent);
        }
        // anything else
        urlContent += tokenizer.pick();
        tokenizer.step();
      }
      return TokenFactory(TokenType.URL, urlContent);
    }
  },
};

export class Tokenizer {
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

  /**
   * 生成Token用的
   */
  public nextToken() {
    for (const tokenGenerator in generateToken) {
      if (generateToken.hasOwnProperty(tokenGenerator)) {
        const token = generateToken[tokenGenerator](this);
        if (token) {
          return token;
        }
      }
    }
  }
}
