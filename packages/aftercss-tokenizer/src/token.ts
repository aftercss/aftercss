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
  BAD_URL = 'BAD_URL',
  BAD_COMMENT = 'BAD_COMMENT',
  HASH = 'HASH',
  NUMBER = 'NUMBER',
  PERCENTAGE = 'PERCENTAGE',
  DIMENSION = 'DIMENSION',
  URL = 'URL',
  UNICODE_RANGE = 'UNICODE_RANGE',
  CDO = 'CDO',
  CDC = 'CDC',
  COLON = 'COLON',
  SEMI = 'SEMI',
  FUNCTION = 'FUNCTION',
}

class Token {
  public type: TokenType = TokenType.ANY;
  /**
   * maybe undefined will save some Memory than ''
   */
  public raw: string = undefined;
  public constructor(type: TokenType, raw?: string) {
    this.type = type;
    if (raw !== undefined) {
      this.raw = raw;
    }
  }
  public toString() {
    return JSON.stringify(this, null, 2);
  }
}

function TokenFactory(type: TokenType, content?: any): Token {
  return new Token(type, content);
}

export { TokenFactory };
