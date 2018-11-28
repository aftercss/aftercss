// tslint:disable max-classes-per-file
export enum TokenMatchType {
  STRING = 'STRING',
  BASE = 'BASE',
  SUB = 'SUB',
  ITEM = 'ITEM',
  JOIN = 'JOIN',
  OR = 'OR',
}
export class Token {
  public matchType: TokenMatchType;
  public start: number;
  public end: number;
}
export class StringToken extends Token {
  public matchType = TokenMatchType.STRING;
}
export class BaseToken extends Token {
  public matchType = TokenMatchType.BASE;
  public name: string;
}
export class SubToken extends Token {
  public matchType = TokenMatchType.SUB;
  public name: string;
  public childTokens: Token[] = [];
}
export class ItemToken extends Token {
  public matchType = TokenMatchType.ITEM;
  public tokens: Token[];
}
export class JoinToken extends Token {
  public matchType = TokenMatchType.JOIN;
  public tokens: Token[];
}
export class OrToken extends Token {
  public matchType = TokenMatchType.OR;
  public token: Token;
}
