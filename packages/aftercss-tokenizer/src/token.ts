// tslint:disable max-classes-per-file
export enum TokenType {
  COMMENT = 'COMMENT',
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
  ANY = 'ANY',
  IDENT = 'IDENT', // NO
  ATKEYWORD = 'ATKEYWORD',
  STRING = 'STRING',
  BAD_STRING = 'BAD_STRING',
  BAD_URI = 'BAD_URI',
  BAD_COMMENT = 'BAD_COMMENT',
  HASH = 'HASH',
  NUMBER = 'NUMBER',
  PERCENTAGE = 'PERCENTAGE',
  DIMENSION = 'DIMENSION',
  URI = 'URI',
  UNICODE_RANGE = 'UNICODE_RANGE',
  CDO = 'CDO',
  CDC = 'CDC',
  COLON = 'COLON',
  SEMI = 'SEMI',
}

export class Token {
  public type: TokenType = TokenType.ANY;
  /**
   * maybe undefined will save some Memory than ''
   */
  public raw: string = undefined;
  public constructor(type: TokenType, raw?: string) {
    this.type = type;
    if (raw) {
      this.raw = raw;
    }
  }
  public JSON() {
    return {
      raw: this.raw,
      type: this.type,
    };
  }
}
/**
 * New Line
 */
enum NewLineTokenType {
  RN = 'RN',
  R = 'R',
  N = 'N',
  F = 'F',
}
export class NewLineToken extends Token {
  public endType: NewLineTokenType;
  public constructor(type: TokenType, raw?: string) {
    super(type, raw);
    switch (raw) {
      case '\r\n':
        this.endType = NewLineTokenType.RN;
      case '\n':
        this.endType = NewLineTokenType.N;
      case '\r':
        this.endType = NewLineTokenType.R;
      case '\f':
        this.endType = NewLineTokenType.F;
      default:
        throw new Error(`unexpect ${raw} for NewLineTokenType`);
    }
  }
}

function TokenFactory(type: TokenType.EOF): Token;
function TokenFactory(type: TokenType.COMMENT | TokenType.NEWLINE, content: string): Token;
function TokenFactory(type: TokenType, content?: string): Token {
  if (type === TokenType.NEWLINE) {
    return new NewLineToken(type, content);
  }
  return new Token(type, content);
}

export { TokenFactory };
