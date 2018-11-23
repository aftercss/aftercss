import { IDimensionProp, IHashProp, IPercentageProp, Token, TokenFactory, TokenType } from '../token';
import { BaseTokenizer } from './base-tokenizer';
import { helper, IEscapedorName } from './css-tokenizer-helper';

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
    const name = helper.consumeName(this);
    const atkeywordContent = name.content;
    const atkeywordRaw = `@${name.raw}`;
    return TokenFactory(TokenType.ATKEYWORD, atkeywordRaw, atkeywordContent);
  }

  /**
   * comment token
   * https://www.w3.org/TR/css-syntax-3/#comment-diagram
   */
  public commentToken() {
    if (this.eat('/*')) {
      const commentContent = this.isEof() ? '' : this.readUntil(/\*\//);
      let commentRaw = `/*${commentContent}`;
      if (this.eat('*/')) {
        commentRaw += '*/';
      }
      return TokenFactory(TokenType.COMMENT, commentRaw, commentContent);
    }
  }

  public delimToken() {
    const delimContent = this.pick();
    this.step();
    return TokenFactory(TokenType.DELIM, delimContent, delimContent);
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
    const name = helper.consumeName(this);
    hashContent.value = name.content;
    return TokenFactory(TokenType.HASH, `#${name.raw}`, hashContent);
  }
  /**
   *  consume an ident-like token
   *  https://www.w3.org/TR/css-syntax-3/#consume-an-ident-like-token
   *  already ensure that the current code point is a valid identifier-starter
   */
  public identLikeToken() {
    const name = helper.consumeName(this);
    if (name.content.toLowerCase() === 'url' && this.eat('(')) {
      name.raw += '(';
      return this.urlToken(name);
    } else if (this.eat('(')) {
      // function token
      return TokenFactory(TokenType.FUNCTION, `${name.raw}(`, name.content);
    }
    // ident token
    return TokenFactory(TokenType.IDENT, name.raw, name.content);
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
      const name = helper.consumeName(this);
      dimensionContent.unit = name.content;
      const dimensionRaw = dimensionContent.repr + name.raw;
      return TokenFactory(TokenType.DIMENSION, dimensionRaw, dimensionContent);
    }
    if (this.eat('%')) {
      const percentageContent: IPercentageProp = {
        repr: numberContent.repr,
        value: numberContent.value,
      };
      return TokenFactory(TokenType.PERCENTAGE, `${percentageContent.repr}%`, percentageContent);
    }
    return TokenFactory(TokenType.NUMBER, numberContent.repr, numberContent);
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
    let stringRaw = quote;
    while (!this.eat(quote)) {
      if (this.isEof()) {
        return TokenFactory(TokenType.STRING, stringRaw, stringContent);
      } else if (this.pick() === '\\' && this.pick(1) === '\n') {
        stringRaw += '\\\n';
        this.step(2);
        continue;
      } else if (helper.isValidEscape(this)) {
        this.step(); // consume '\\'
        const escaped = helper.consumeEscaped(this);
        stringContent += escaped.content;
        stringRaw += escaped.raw;
      } else if (this.eat('\n')) {
        return TokenFactory(TokenType.BAD_STRING, `${stringContent}\n`);
      } else {
        stringContent += this.pick();
        stringRaw += this.pick();
        this.step();
      }
    }
    stringRaw += quote;
    return TokenFactory(TokenType.STRING, stringRaw, stringContent);
  }

  /**
   * url token || bad url token
   * https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
   */
  public urlToken(escapedName: IEscapedorName) {
    // consume as much whitespace as possible
    let urlRaw = escapedName.raw + this.allowWhitespace();
    let urlContent = '';
    // string token
    if (this.pick() === "'" || this.pick() === '"') {
      const stringToken = this.stringToken();
      if (stringToken) {
        urlContent = stringToken.content;
        urlRaw += stringToken.raw;
        // bad url token
        if (stringToken.type === 'BAD_STRING') {
          // consume the remnants of a bad url
          urlRaw += helper.consumeBadURL(this);
          return TokenFactory(TokenType.BAD_URL, urlRaw);
        }
        urlRaw += this.allowWhitespace();
        if (this.eat(')') || this.isEof()) {
          if (this.pick(-1) === ')') {
            urlRaw += ')';
          }
          return TokenFactory(TokenType.URL, urlRaw, urlContent);
        }
        urlRaw += helper.consumeBadURL(this);
        return TokenFactory(TokenType.BAD_URL, urlRaw);
      }
    }
    while (!this.eat(')')) {
      if (this.isEof()) {
        return TokenFactory(TokenType.URL, urlRaw, urlContent);
      }
      // non-printalbe code point
      if (this.eat('(')) {
        urlRaw += '(';
        urlRaw += helper.consumeBadURL(this);
        return TokenFactory(TokenType.BAD_URL, urlRaw);
      }
      // eacape code point
      if (this.eat('\\')) {
        // invalid escape code point
        if (this.eat('\n')) {
          urlRaw += '\\\n';
          urlRaw += helper.consumeBadURL(this);
          return TokenFactory(TokenType.BAD_URL, urlRaw);
        }
        const escaped = helper.consumeEscaped(this);
        urlContent += escaped.content;
        urlRaw = escaped.raw;
        continue;
      }
      if (/[ \t\n]/.test(this.pick())) {
        urlRaw += this.allowWhitespace();
        if (this.eat(')')) {
          urlRaw += ')';
          return TokenFactory(TokenType.URL, urlRaw, urlContent);
        }
        urlRaw += helper.consumeBadURL(this);
        return TokenFactory(TokenType.BAD_URL, urlRaw);
      }
      // anything else
      urlContent += this.pick();
      urlRaw += this.pick();
      this.step();
    }
    urlRaw += ')';
    return TokenFactory(TokenType.URL, urlRaw, urlContent);
  }

  /**
   * consume a unicode-range token
   * https://www.w3.org/TR/css-syntax-3/#consume-a-unicode-range-token
   */
  public unicodeRangeToken() {
    let unicodeRangeRaw = `${this.pick(-2)}+`;
    const hexNumberReg = /[0-9]{1,6}/;
    const startDigits = this.matchReg(hexNumberReg);
    this.step(startDigits.length);
    unicodeRangeRaw += startDigits;
    let rangeStart = `0x${startDigits}`;
    let rangeEnd = `0x${startDigits}`;
    for (let i = startDigits.length; i < 6; i++) {
      if (this.eat('?')) {
        rangeStart += '0';
        rangeEnd += 'F';
        unicodeRangeRaw += '?';
      }
    }
    // has consumed '?'
    if (rangeStart !== `0x${startDigits}`) {
      return TokenFactory(TokenType.UNICODE_RANGE, unicodeRangeRaw, {
        end: rangeEnd,
        start: rangeStart,
      });
    }
    if (this.pick() === '-' && hexNumberReg.test(this.pick(1))) {
      this.eat('-');
      unicodeRangeRaw += '-';
      const endDigits = this.matchReg(hexNumberReg);
      unicodeRangeRaw += endDigits;
      this.step(endDigits.length);
      rangeEnd = `0x${endDigits}`;
    }
    return TokenFactory(TokenType.UNICODE_RANGE, unicodeRangeRaw, {
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
        const whitespaceRaw = this.allowWhitespace();
        return TokenFactory(TokenType.WHITESPACE, whitespaceRaw);
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
          return TokenFactory(TokenType.SUFFIX_MATCH, '$=');
        }
        return this.delimToken();
      case "'":
        return this.stringToken();
      case '(':
        this.step();
        return TokenFactory(TokenType.LEFT_PARENTHESIS, '(');
      case ')':
        this.step();
        return TokenFactory(TokenType.RIGHT_PARENTHESIS, ')');
      case '*':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.SUBSTRING_MATCH, '*=');
        }
        return this.delimToken();
      case '+':
        if (helper.isNumberStarter(this)) {
          return this.numericToken();
        }
        return this.delimToken();
      case ',':
        this.step();
        return TokenFactory(TokenType.COMMA, ',');
      case '-':
        if (helper.isNumberStarter(this)) {
          return this.numericToken();
        }

        if (helper.isIdentifierStarter(this)) {
          return this.identLikeToken();
        }

        if (this.pick(1) === '-' && this.pick(2) === '>') {
          this.step(3);
          return TokenFactory(TokenType.CDC, '-->');
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
        this.step();
        return TokenFactory(TokenType.COLON, ':');
      case ';':
        this.step();
        return TokenFactory(TokenType.SEMI, ';');
      case '<':
        if (this.pick(1) === '!' && this.pick(2) === '-' && this.pick(3) === '-') {
          this.step(3);
          return TokenFactory(TokenType.CDO, '<!--');
        }
        return this.delimToken();
      case '@':
        if (helper.isIdentifierStarter(this, 1)) {
          return this.atkeywordToken();
        }
        return this.delimToken();
      case '[':
        this.step();
        return TokenFactory(TokenType.LEFT_SQUARE_BRACKET, '[');
      case '\\':
        if (helper.isValidEscape(this)) {
          return this.identLikeToken();
        }
        return this.delimToken();
      case ']':
        this.step();
        return TokenFactory(TokenType.RIGHT_SQUARE_BRACKET, ']');
      case '^':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.PREFIX_MATCH, '^=');
        }
        return this.delimToken();
      case '{':
        this.step();
        return TokenFactory(TokenType.LEFT_CURLY_BRACKET, '{');
      case '}':
        this.step();
        return TokenFactory(TokenType.RIGHT_CURLY_BRACKET, '}');
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
          return TokenFactory(TokenType.DASH_MATCH, '|=');
        }
        if (this.pick(1) === '|') {
          this.step(2);
          return TokenFactory(TokenType.COLUMN, '||');
        }
        return this.delimToken();
      case '~':
        if (this.pick(1) === '=') {
          this.step(2);
          return TokenFactory(TokenType.INCLUDE_MATCH, '~=');
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