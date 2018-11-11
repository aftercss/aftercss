import { TokenFactory, TokenType } from '../token';
import { BaseTokenizer } from './base-tokenizer';
import { helper } from './css-tokenizer-helper';

export class CSSTokenizer extends BaseTokenizer {
  public atkeywordToken() {
    /**
     * at-key-word token
     * https://www.w3.org/TR/css-syntax-3/#at-keyword-token-diagram
     */
    if (this.eat('@')) {
      return TokenFactory(TokenType.ATKEYWORD, '@');
    }
  }
  public commentToken() {
    /**
     * comment token
     * https://www.w3.org/TR/css-syntax-3/#comment-diagram
     */
    if (this.eat('/*')) {
      const commentContent = this.readUntil(/\*\//);
      return TokenFactory(TokenType.COMMENT, commentContent);
    }
  }
  public eofToken() {
    if (this.isEof()) {
      return TokenFactory(TokenType.EOF);
    }
  }
  public newlineToken() {
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
  }
  public stringToken() {
    /**
     * string token  || bad string token
     * https://www.w3.org/TR/css-syntax-3/#string-token-diagram
     */

    if (this.eat("'") || this.eat('"')) {
      const quote = this.pick(-1);
      let stringContent = '';
      while (!this.eat(quote)) {
        if (this.isEof()) {
          return TokenFactory(TokenType.STRING, stringContent);
        } else if (this.eat('\\')) {
          stringContent += helper.consumeEscaped(this);
        } else if (this.eat('\n')) {
          return TokenFactory(TokenType.BAD_STRING, `${stringContent}\n`);
        } else {
          stringContent += this.pick();
          this.step();
        }
      }
      return TokenFactory(TokenType.STRING, stringContent);
    }
  }
  public urlToken() {
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
        const stringToken = this.stringToken();
        if (stringToken) {
          urlContent = stringToken.raw;
          // bad url token
          if (stringToken.type === 'BAD_STRING') {
            // consume the remnants of a bad url
            urlContent += helper.consumeBadURL(this);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
          this.allowWhitespace();
          if (this.eat(')') || this.isEof()) {
            return TokenFactory(TokenType.URL, urlContent);
          }
          urlContent += ' ';
          urlContent += helper.consumeBadURL(this);
          return TokenFactory(TokenType.BAD_URL, urlContent);
        }
      }
      while (!this.eat(')')) {
        if (this.isEof()) {
          return TokenFactory(TokenType.URL, urlContent);
        }
        // non-printalbe code point
        if (this.eat('(')) {
          urlContent += '(';
          urlContent += helper.consumeBadURL(this);
          return TokenFactory(TokenType.BAD_URL, urlContent);
        }
        // eacape code point
        if (this.eat('\\')) {
          // invalid escape code point
          if (this.eat('\n')) {
            urlContent += '\n';
            urlContent += helper.consumeBadURL(this);
            return TokenFactory(TokenType.BAD_URL, urlContent);
          }
          urlContent += helper.consumeEscaped(this);
          continue;
        }
        if (this.eat(' ')) {
          this.allowWhitespace();
          if (this.eat(')')) {
            return TokenFactory(TokenType.URL, urlContent);
          }
          urlContent += ' ';
          urlContent += helper.consumeBadURL(this);
          return TokenFactory(TokenType.BAD_URL, urlContent);
        }
        // anything else
        urlContent += this.pick();
        this.step();
      }
      return TokenFactory(TokenType.URL, urlContent);
    }
  }
  /**
   * 生成Token用的
   */
  public nextToken() {
    /**
     * 这里是排列优先级的
     * 跟标准核对一下优先级
     */
    const tokens = [
      this.atkeywordToken,
      this.commentToken,
      this.eofToken,
      this.newlineToken,
      this.stringToken,
      this.urlToken,
    ];
    for (const i of tokens) {
      const token = i();
      if (token) {
        return token;
      }
    }
  }
}
