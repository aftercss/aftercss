import { IDimensionProp, IPercentageProp, Token, TokenFactory, TokenType } from '../token';
import { BaseTokenizer } from './base-tokenizer';
import { helper } from './css-tokenizer-helper';

export class CSSTokenizer extends BaseTokenizer {
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
  public identToken() {
    if (helper.isIndentifierStarter(this)) {
      const name = helper.consumeName(this);
      if (name.toLowerCase() === 'url' && this.eat('(')) {
        return this.urlToken();
      } else if (this.eat('(')) {
        // function token
        return TokenFactory(TokenType.FUNCTION, name);
      }
      // ident token
      return TokenFactory(TokenType.IDENT, name);
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
  public numberToken() {
    /**
     * consume a numeric token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-numeric-token
     */
    if (helper.isNumberStarter(this)) {
      const numberContent = helper.consumeNumber(this);
      if (helper.isIndentifierStarter(this)) {
        const dimensionContent: IDimensionProp = JSON.parse(JSON.stringify(numberContent));
        dimensionContent.unit = helper.consumeName(this);
        return TokenFactory(TokenType.DIMENSION, dimensionContent);
      }
      if (this.eat('%')) {
        const percentageContent: IPercentageProp = {
          repr: numberContent.repr,
          value: numberContent.value,
        };
        return TokenFactory(TokenType.PERCENTAGE, percentageContent);
      }
      return TokenFactory(TokenType.NUMBER, numberContent);
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
        } else if (helper.isValidEscape(this.pick(), this.pick(1))) {
          this.step(); // consume '\\'
          stringContent += helper.consumeEscaped(this);
        } else if (this.eat('\\') && this.eat('\n')) {
          continue;
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
     * url token || bad url token
     * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
     */
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
  public unicodeRangeToken() {
    const hexNumberReg = /[0-9]{1,6}/;
    if (this.eat('u+') && (this.pick() === '?' || hexNumberReg.test(this.pick()))) {
      const startDigits = this.matchReg(hexNumberReg);
      this.step(startDigits.length);
      let rangeStart = `0x${startDigits}`;
      let rangeEnd = `0x${startDigits}`;
      for (let i = startDigits.length; i < 6; i++) {
        if (this.eat('?')) {
          rangeStart += '0';
          rangeEnd += 'F';
        }
      }
      // has consumed '?'
      if (rangeStart !== `0x${startDigits}`) {
        return TokenFactory(TokenType.UNICODE_RANGE, {
          end: rangeEnd,
          start: rangeStart,
        });
      }
      if (this.pick() === '-' && hexNumberReg.test(this.pick(1))) {
        this.eat('-');
        const endDigits = this.matchReg(hexNumberReg);
        this.step(endDigits.length);
        rangeEnd = `0x${endDigits}`;
      }
      return TokenFactory(TokenType.UNICODE_RANGE, {
        end: rangeEnd,
        start: rangeStart,
      });
    }
  }
  /**
   * 生成Token用的
   */
  public nextToken() {
    /**
     *  consume a token
     *  https://www.w3.org/TR/css-syntax-3/#consume-a-token
     */
    return this.unicodeRangeToken();
  }
}
