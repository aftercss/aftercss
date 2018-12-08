// tslint:disable max-export classes-per-file max-classes-per-file
import { SourceNode } from 'source-map';

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

export interface ITokenMap {
  DIMENSION: DimensionToken;
  HASH: HashToken;
  NUMBER: NumberToken;
  PERCENTAGE: PercentageToken;
  UNICODE_RANGE: UnicodeRangeToken;
  [prop: string]: Token;
}

export class Token {
  public type: TokenType = TokenType.ANY;
  public raw: string;
  public content: string;
  public start: number;
  public sourceNode: SourceNode;
  public constructor(type: TokenType, start: number, raw?: string, content?: string) {
    this.type = type;
    this.raw = raw;
    this.content = content;
    this.start = start;
  }

  public checkType<T extends TokenType>(type: T): this is ITokenMap[T] {
    return this.type === type;
  }
}

export class DimensionToken extends Token {
  public numberType: 'integer' | 'number';
  public repr: string;
  public unit: string;
  public value: number;
  constructor(type: TokenType.DIMENSION, start: number, raw: string, prop: IDimensionProp) {
    super(type, start, raw);
    this.numberType = prop.type;
    this.repr = prop.repr;
    this.unit = prop.unit;
    this.value = prop.value;
  }
}

export class HashToken extends Token {
  public hashType?: string;
  constructor(type: TokenType.HASH, start: number, raw: string, prop: IHashProp) {
    super(type, start, raw, prop.value);
    if (prop.type) {
      this.hashType = prop.type;
    }
  }
}

export class NumberToken extends Token {
  public numberType: 'integer' | 'number';
  public repr: string;
  public value: number;
  constructor(type: TokenType.NUMBER, start: number, raw: string, prop: INumberProp) {
    super(type, start, raw);
    this.numberType = prop.type;
    this.repr = prop.repr;
    this.value = prop.value;
  }
}

export class PercentageToken extends Token {
  public repr: string;
  public value: number;
  constructor(type: TokenType.PERCENTAGE, start: number, raw: string, prop: IPercentageProp) {
    super(type, start, raw);
    this.repr = prop.repr;
    this.value = prop.value;
  }
}

export class UnicodeRangeToken extends Token {
  public unistart: string;
  public uniend: string;
  constructor(type: TokenType.UNICODE_RANGE, start: number, raw: string, prop: IUnicodeRangeProp) {
    super(type, start, raw);
    this.unistart = prop.start;
    this.uniend = prop.end;
  }
}

export function TokenFactory(
  type: TokenType.DIMENSION,
  start: number,
  raw: string,
  prop: IDimensionProp,
): DimensionToken;
export function TokenFactory(type: TokenType.HASH, start: number, raw: string, prop: IHashProp): HashToken;
export function TokenFactory(type: TokenType.NUMBER, start: number, raw: string, prop: INumberProp): NumberToken;
export function TokenFactory(
  type: TokenType.PERCENTAGE,
  start: number,
  raw: string,
  prop: IPercentageProp,
): PercentageToken;
export function TokenFactory(
  type: TokenType.UNICODE_RANGE,
  start: number,
  raw: string,
  prop: IUnicodeRangeProp,
): UnicodeRangeToken;
export function TokenFactory(type: TokenType, start: number, raw?: string, content?: string): Token;
export function TokenFactory(type: TokenType, start: number, raw?: string, content?: any): Token {
  switch (type) {
    case TokenType.DIMENSION:
      return new DimensionToken(type, start, raw, content);
    case TokenType.HASH:
      return new HashToken(type, start, raw, content);
    case TokenType.NUMBER:
      return new NumberToken(type, start, raw, content);
    case TokenType.PERCENTAGE:
      return new PercentageToken(type, start, raw, content);
    case TokenType.UNICODE_RANGE:
      return new UnicodeRangeToken(type, start, raw, content);
    default:
      return new Token(type, start, raw, content);
  }
}
