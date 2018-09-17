export enum TokenType {
  EOF = 'EOF',
  ANY = 'ANY',
  IDENT = 'IDENT',
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
  COMMENT = 'COMMENT'
}

export class Token {
  public type: TokenType = TokenType.ANY;
  /**
   * maybe undefined will save some Memory than ''
   */
  public content: string = undefined;
  public constructor(type: TokenType, content?: string) {
    this.type = type;
    if (content) {
      this.content = content;
    }
  }
}
function TokenFactory(type: TokenType.EOF): Token;
function TokenFactory(type: TokenType.COMMENT, content: string): Token;
function TokenFactory(type: TokenType, content?: string): Token {
  return new Token(type, content);
}

export { TokenFactory };
