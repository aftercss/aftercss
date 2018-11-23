// tslint:disable max-classes-per-file
export enum TokenType {
  ANY = 'ANY',
  ATKEYWORD = 'ATKEYWORD',
  BAD_COMMENT = 'BAD_COMMENT',
  BAD_STRING = 'BAD_STRING',
  BAD_URL = 'BAD_URL',
  CDO = 'CDO',
  CDC = 'CDC',
  COLON = 'COLON',
  COLUMN = 'COLUMN',
  COMMENT = 'COMMENT',
  COMMA = 'COMMA',
  DASH_MATCH = 'DASH_MATCH',
  DIMENSION = 'DIMENSION',
  DELIM = 'DELIM',
  EOF = 'EOF',
  FUNCTION = 'FUNCTION',
  HASH = 'HASH',
  IDENT = 'IDENT', // NO
  INCLUDE_MATCH = 'INCLUDE_MATCH',
  LEFT_CURLY_BRACKET = 'LEFT_CURLY_BRACKET',
  LEFT_PARENTHESIS = 'LEFT_PARENTHESIS',
  LEFT_SQUARE_BRACKET = 'LEFT_SQUARE_BRACKET',
  LESS_THAN_SIGN = 'LESS_THAN_SIGN',
  NEWLINE = 'NEWLINE',
  UNICODE_RANGE = 'UNICODE_RANGE',
  NUMBER = 'NUMBER',
  PERCENTAGE = 'PERCENTAGE',
  PREFIX_MATCH = 'PREFIX_MATCH',
  RIGHT_CURLY_BRACKET = 'RIGHT_CURLY_BRACKET',
  RIGHT_PARENTHESIS = 'RIGHT_PARENTHESIS',
  RIGHT_SQUARE_BRACKET = 'RIGHT_SQUARE_BRACKET',
  SEMI = 'SEMI',
  STRING = 'STRING',
  SUBSTRING_MATCH = 'SUBSTRING_MATCH',
  SUFFIX_MATCH = 'SUFFIX_MATCH',
  URL = 'URL',
  WHITESPACE = 'WHITESPACE',
}

export interface IDimensionProp {
  repr: string;
  type: 'integer' | 'number';
  unit: string;
  value: number;
}

export interface IHashProp {
  value: string;
  type?: string;
}

export interface INumberProp {
  repr: string;
  type: 'integer' | 'number';
  value: number;
}

export interface IPercentageProp {
  repr: string;
  value: number;
}
export interface IUnicodeRangeProp {
  start: string;
  end: string;
}

class Token {
  public type: TokenType = TokenType.ANY;
  /**
   * maybe undefined will save some Memory than ''
   */
  public raw: string = undefined;
  public content: string = undefined;
  public constructor(type: TokenType, raw?: string, content?: string) {
    this.type = type;
    if (raw !== undefined) {
      this.raw = raw;
    }
    if (content !== undefined) {
      this.content = content;
    }
  }
  public toString() {
    return JSON.stringify(this, null, 2);
  }
}

class DimensionToken extends Token {
  public numberType: 'integer' | 'number';
  public repr: string;
  public unit: string;
  public value: number;
  constructor(type: TokenType.DIMENSION, raw: string, prop: IDimensionProp) {
    super(type, raw);
    this.numberType = prop.type;
    this.repr = prop.repr;
    this.unit = prop.unit;
    this.value = prop.value;
  }
}

class HashToken extends Token {
  public hashType?: string;
  constructor(type: TokenType.HASH, raw: string, prop: IHashProp) {
    super(type, raw, prop.value);
    if (prop.type) {
      this.hashType = prop.type;
    }
  }
}

class NumberToken extends Token {
  public numberType: 'integer' | 'number';
  public repr: string;
  public value: number;
  constructor(type: TokenType.NUMBER, raw: string, prop: INumberProp) {
    super(type, raw);
    this.numberType = prop.type;
    this.repr = prop.repr;
    this.value = prop.value;
  }
}

class PercentageToken extends Token {
  public repr: string;
  public value: number;
  constructor(type: TokenType.PERCENTAGE, raw: string, prop: IPercentageProp) {
    super(type, raw);
    this.repr = prop.repr;
    this.value = prop.value;
  }
}

class UnicodeRangeToken extends Token {
  public start: string;
  public end: string;
  constructor(type: TokenType.UNICODE_RANGE, raw: string, prop: IUnicodeRangeProp) {
    super(type, raw);
    this.start = prop.start;
    this.end = prop.end;
  }
}

function TokenFactory(type: TokenType.DIMENSION, raw: string, prop: IDimensionProp): DimensionToken;
function TokenFactory(type: TokenType.HASH, raw: string, prop: IHashProp): HashToken;
function TokenFactory(type: TokenType.NUMBER, raw: string, prop: INumberProp): NumberToken;
function TokenFactory(type: TokenType.PERCENTAGE, raw: string, prop: IPercentageProp): PercentageToken;
function TokenFactory(type: TokenType.UNICODE_RANGE, raw: string, prop: IUnicodeRangeProp): UnicodeRangeToken;
function TokenFactory(type: TokenType, raw?: string, content?: string): Token;
function TokenFactory(type: TokenType, raw?: string, content?: any): Token {
  switch (type) {
    case TokenType.DIMENSION:
      return new DimensionToken(type, raw, content);
    case TokenType.HASH:
      return new HashToken(type, raw, content);
    case TokenType.NUMBER:
      return new NumberToken(type, raw, content);
    case TokenType.PERCENTAGE:
      return new PercentageToken(type, raw, content);
    case TokenType.UNICODE_RANGE:
      return new UnicodeRangeToken(type, raw, content);
    default:
      return new Token(type, raw, content);
  }
}

export { Token, TokenFactory };
