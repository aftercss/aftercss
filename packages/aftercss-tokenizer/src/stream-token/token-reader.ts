import { MessageCollection } from '@aftercss/shared';
import { Token, TokenFactory, TokenType } from './../token';
import { CSSTokenizer } from './../tokenizer/css-tokenizer';

export enum TokenReaderType {
  Tokenizer = 'Tokenizer',
  TokenList = 'TokenList',
}

/**
 * Token Reader
 * flat different source all to `nextToken()` API
 * @support stream type
 * @support array type
 */
export class TokenReader {
  /**
   * current reader type
   */
  private readerType: TokenReaderType;
  /**
   * meta-data for list type
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
    } else {
      this.readerType = TokenReaderType.Tokenizer;
      this.tokenizer = tokensOrTokenizer as CSSTokenizer;
      this.$currentToken = this.tokenizer.nextToken();
      return;
    }
  }

  public currentToken(): Token {
    if (this.readerType === TokenReaderType.TokenList) {
      const length = this.tokenList.length;
      if (this.currentIndex >= length) {
        const start = length > 0 ? this.tokenList[length - 1].start : 0;
        return TokenFactory(TokenType.EOF, start);
      }
      return this.tokenList[this.currentIndex];
    } else {
      return this.$currentToken;
    }
  }

  public step() {
    if (this.readerType === TokenReaderType.TokenList) {
      this.currentIndex++;
    } else {
      this.$currentToken = this.tokenizer.nextToken();
    }
  }

  public getNextToken() {
    if (this.readerType === TokenReaderType.TokenList) {
      return this.tokenList[this.currentIndex++];
    } else {
      this.$currentToken = this.tokenizer.nextToken();
      return this.$currentToken;
    }
  }
}
