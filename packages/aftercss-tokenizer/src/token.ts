enum TokenType {
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

class Token {
  public type: TokenType = TokenType.ANY;
  public node: any = null;
}
