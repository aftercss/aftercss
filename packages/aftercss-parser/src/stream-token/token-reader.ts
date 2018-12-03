import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token } from '@aftercss/tokenizer';

export enum TokenReaderType {
  Tokenizer = 'Tokenizer',
  TokenList = 'TokenList',
}

/**
 * Token Reader
 * flat different source all to `getNextToken()` API
 * @support stream type
 * @support array type
 */
export class TokenReader {
  /**
   * current reader type
   */
  private readerType: TokenReaderType;
  /**
   * meta-data for list tyep
   */
  private tokenList: Token[];
  private currentIndex: number = 0;
  /**
   * meta-data for tokenizer
   */
  private tokenizer: CSSTokenizer;
  private $currentToken: Token;
  /**
   * overload
   * @param tokensOrTokenizer
   */
  public constructor(tokensOrTokenizer: Token[] | CSSTokenizer) {
    if (Object.prototype.toString.call(tokensOrTokenizer) === '[object Array]') {
      this.tokenList = tokensOrTokenizer as Token[];
      this.readerType = TokenReaderType.TokenList;
      return;
    }
    if (tokensOrTokenizer instanceof CSSTokenizer) {
      this.readerType = TokenReaderType.Tokenizer;
      return;
    }
    /**
     * checked source-type once only
     */
    throw new Error(MessageCollection._READER_INIT_WRONG_());
  }

  public currentToken(): Token {
    if (this.readerType === TokenReaderType.TokenList) {
      return this.tokenList[this.currentIndex];
    } else {
      return this.$currentToken;
    }
  }

  public step() {
    if (this.readerType === TokenReaderType.TokenList) {
      this.currentIndex++;
    } else {
      this.$currentToken = this.tokenizer.getNextToken();
    }
  }

  public getNextToken() {
    if (this.readerType === TokenReaderType.TokenList) {
      return this.tokenList[this.currentIndex++];
    } else {
      this.$currentToken = this.tokenizer.getNextToken();
      return this.$currentToken;
    }
  }
}
