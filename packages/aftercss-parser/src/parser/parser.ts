import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token, TokenReader, TokenType } from '../../../aftercss-tokenizer/lib';
import { CSSSyntaxError } from './parser-error';

export abstract class Parser extends TokenReader {
  public constructor(tokensOrTokenizer: Token[] | CSSTokenizer) {
    super(tokensOrTokenizer);
  }
  /**
   * generate CSSSyntaxError with location infos
   * @param message
   */
  public error(message: string) {
    const location = this.currentToken().start;
    return new CSSSyntaxError(location, message);
  }

  /**
   * consume a function Node
   */
  public consumeFunction(): string {
    let funcNode = '';
    funcNode += this.currentToken().raw;
    this.step();
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.EOF:
          throw this.error(MessageCollection._UNCLOSED_BLOCK_('when consuming Function Node'));
        case TokenType.FUNCTION:
          funcNode += this.consumeFunction();
          break;
        case TokenType.LEFT_SQUARE_BRACKET:
          funcNode += this.consumeSquareBracket();
          break;
        case TokenType.RIGHT_PARENTHESIS:
          funcNode += currentToken.raw;
          this.step();
          return funcNode;
        case TokenType.WHITESPACE:
        default:
          funcNode += currentToken.raw;
          this.step();
          break;
      }
    }
  }

  /**
   * consume a square-bracket block
   */
  public consumeSquareBracket(): string {
    let squareBracket = '';
    squareBracket += this.currentToken().raw;
    this.step();
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.LEFT_SQUARE_BRACKET:
          squareBracket += this.consumeSquareBracket();
          break;
        case TokenType.EOF:
          throw this.error(MessageCollection._UNCLOSED_BLOCK_('when consuming a square bracket'));
        case TokenType.FUNCTION:
          squareBracket += this.consumeFunction();
          break;
        case TokenType.RIGHT_SQUARE_BRACKET:
          squareBracket += currentToken.raw;
          this.step();
          return squareBracket;
        default:
          this.step();
          squareBracket += currentToken.raw;
      }
    }
  }
}
