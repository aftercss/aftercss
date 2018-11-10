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
}

export class Token {
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
/**
 * New Line
 */
// enum NewLineTokenType {
//   RN = 'RN',
//   R = 'R',
//   N = 'N',
//   F = 'F',
// }
// export class NewLineToken extends Token {
//   public endType: NewLineTokenType;
//   public constructor(type: TokenType, raw?: string) {
//     super(type, raw);
//     switch (raw) {
//       case '\r\n':
//         this.endType = NewLineTokenType.RN;
//         break;
//       case '\n':
//         this.endType = NewLineTokenType.N;
//         break;
//       case '\r':
//         this.endType = NewLineTokenType.R;
//         break;
//       case '\f':
//         this.endType = NewLineTokenType.F;
//         break;
//       default:
//         throw new Error(`unexpect ${raw} for NewLineTokenType`);
//     }
//   }
// }

function TokenFactory(type: TokenType, content?: string): Token {
  return new Token(type, content);
}

export { TokenFactory };
