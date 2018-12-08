import { MessageCollection } from '@aftercss/shared';
import { Token, TokenReader, TokenType } from '@aftercss/tokenizer';
import { CSSSyntaxError } from './parser-error';
import { ParserNode, Root } from './parser-node';
/**
 * Generate AST from Tokens
 */
export class Parser extends TokenReader {
  public currentParserNode: ParserNode = new Root();
  public stack: ParserNode[] = [this.currentParserNode];
  /**
   * generate CSSSyntaxError with location infos
   * @param message
   */
  public error(message: string) {
    const location = this.currentToken().start;
    return new CSSSyntaxError(location, message);
  }

  public addChild(node: ParserNode) {
    this.currentParserNode.childNodes.push(node);
  }

  public allowWhiteSpace(): { start: number; space: string } {
    const whiteSpaceStart = this.currentToken().start;
    let whiteSpace = '';
    while (this.currentToken().type === TokenType.WHITESPACE) {
      whiteSpace += this.currentToken().raw;
      this.step();
    }
    return { start: whiteSpaceStart, space: whiteSpace };
  }

  public parseStyleSheet() {
    // For now, don't care CDO & CDC
    while (this.currentToken().type !== TokenType.EOF) {
      switch (this.currentToken().type) {
        case TokenType.WHITESPACE:
          this.allowWhiteSpace();
          continue;
        case TokenType.NEWLINE:
      }
    }
  }
}
