import { IDimensionProp, IHashProp, IPercentageProp, Token, TokenFactory, TokenType } from '../token';
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

  /**
   * at-key-word token
   * https://www.w3.org/TR/css-syntax-3/#at-keyword-token-diagram
   * already ensure that the current code point is '@'
   */
  public atkeywordToken() {
    this.step(); // consume '@'
    const atkeywordContent = helper.consumeName(this);
    return TokenFactory(TokenType.ATKEYWORD, atkeywordContent);
  }

  /**
   * comment token
   * https://www.w3.org/TR/css-syntax-3/#comment-diagram
   */
  public commentToken() {
    if (this.eat('/*')) {
      const commentContent = this.isEof() ? '' : this.readUntil(/\*\//);
      return TokenFactory(TokenType.COMMENT, commentContent);
    }
  }

  public delimToken() {
    const delimContent = this.pick();
    this.step();
    return TokenFactory(TokenType.DELIM, delimContent);
  }

  /**
   * hash token
   * https://www.w3.org/TR/css-syntax-3/#consume-a-token
   * already know the current code point is '#'
   */
  public hashToken() {
    this.step(); // consume '#'
    const hashContent: IHashProp = {
      value: '',
    };
    if (helper.isIdentifierStarter(this)) {
      hashContent.type = 'id';
    }
    hashContent.value = helper.consumeName(this);
    return TokenFactory(TokenType.HASH, hashContent);
  }
  /**
   *  consume an ident-like token
   *  https://www.w3.org/TR/css-syntax-3/#consume-an-ident-like-token
   *  already ensure that the current code point is a valid identifier-starter
   */
  public identLikeToken() {
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

  /**
   * consume a numeric token
   * https://www.w3.org/TR/css-syntax-3/#consume-a-numeric-token
   * already ensure that the current code point is a valid number-starter
   */
  public numericToken() {
    const numberContent = helper.consumeNumber(this);
    if (helper.isIdentifierStarter(this)) {
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

  /**
   * string token  || bad string token
   * https://www.w3.org/TR/css-syntax-3/#string-token-diagram
   * already know the current code point is '"' or "'"
   */
  public stringToken() {
    const quote = this.pick();
    this.step();
    let stringContent = '';
    while (!this.eat(quote)) {
      if (this.isEof()) {
        return TokenFactory(TokenType.STRING, stringContent);
      } else if (this.pick() === '\\' && this.pick(1) === '\n') {
        this.step(2);
        continue;
      } else if (helper.isValidEscape(this)) {
        this.step(); // consume '\\'
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

  /**
   * url token || bad url token
   * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
   */
  public urlToken() {
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
      if (this.eat(' ') || this.eat('\n') || this.eat('\t')) {
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

  /**
   * consume a unicode-range token
   * https://www.w3.org/TR/css-syntax-3/#consume-a-unicode-range-token
   */
  public unicodeRangeToken() {
    const hexNumberReg = /[0-9]{1,6}/;
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

  /**
   *  consume a token
   *  https://www.w3.org/TR/css-syntax-3/#consume-a-token
   * 	return a single token of any type
   */
  public nextToken() {
    if (this.isEof()) {
      return TokenFactory(TokenType.EOF);
    }
    const currentCodePoint = this.pick();

    switch (currentCodePoint) {
      case ' ':
      case '\t':
      case '\n':
        this.allowWhitespace();
        return TokenFactory(TokenType.WHITESPACE);
      case '"':
        return this.stringToken();
      case '#':
        if (helper.isNameStarter(this, 1) || /[0-9\-]/.test(this.pick(1)) || helper.isValidEscape(this, 1)) {
          return this.hashToken();
        }
        return this.delimToken();
      case '$':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.SUFFIX_MATCH);
        }
        return this.delimToken();
      case "'":
        return this.stringToken();
      case '(':
        return TokenFactory(TokenType.LEFT_PARENTHESIS);
      case ')':
        return TokenFactory(TokenType.RIGHT_PARENTHESIS);
      case '*':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.SUBSTRING_MATCH);
        }
        return this.delimToken();
      case '+':
        if (helper.isNumberStarter(this)) {
          return this.numericToken();
        }
        return this.delimToken();
      case ',':
        return TokenFactory(TokenType.COMMA);
      case '-':
        if (helper.isNumberStarter(this)) {
          return this.numericToken();
        }

        if (helper.isIdentifierStarter(this)) {
          return this.identLikeToken();
        }

        if (this.pick(1) === '-' && this.pick(2) === '>') {
          this.step(3);
          return TokenFactory(TokenType.CDC);
        }
        return this.delimToken();
      case '.':
        if (helper.isNumberStarter(this)) {
          return this.numericToken();
        }
        return this.delimToken();
      case '/':
        if (this.pick(1) === '*') {
          return this.commentToken();
        }
        return this.delimToken();
      case ':':
        return TokenFactory(TokenType.COLON);
      case ';':
        return TokenFactory(TokenType.SEMI);
      case '<':
        if (this.pick(1) === '!' && this.pick(2) === '-' && this.pick(3) === '-') {
          this.step(3);
          return TokenFactory(TokenType.CDO);
        }
        return this.delimToken();
      case '@':
        if (helper.isIdentifierStarter(this, 1)) {
          return this.atkeywordToken();
        }
        return this.delimToken();
      case '[':
        return TokenFactory(TokenType.LEFT_SQUARE_BRACKET);
      case '\\':
        if (helper.isValidEscape(this)) {
          return this.identLikeToken();
        }
        return this.delimToken();
      case ']':
        return TokenFactory(TokenType.RIGHT_SQUARE_BRACKET);
      case '^':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.PREFIX_MATCH);
        }
        return this.delimToken();
      case '{':
        return TokenFactory(TokenType.LEFT_CURLY_BRACKET);
      case '}':
        return TokenFactory(TokenType.RIGHT_CURLY_BRACKET);
      case 'U':
      case 'u':
        if (this.pick(1) === '+' && /[0-9\?]/.test(this.pick(2))) {
          this.step(2);
          return this.unicodeRangeToken();
        }
        return this.identLikeToken();
      case '|':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.DASH_MATCH);
        }
        if (this.pick(1) === '|') {
          this.step(2);
          return TokenFactory(TokenType.COLUMN);
        }
        return this.delimToken();
      case '~':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.INCLUDE_MATCH);
        }
        return this.delimToken();

      default:
        // digit
        if (/[0-9]/.test(currentCodePoint)) {
          return this.numericToken();
        }

        // name start code point
        if (helper.isNameStarter(this)) {
          return this.identLikeToken();
        }

        return this.delimToken();
    }
  }
}
