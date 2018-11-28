import { MessageCollection } from '@aftercss/shared';
import { Token, TokenType } from '@aftercss/tokenizer';
import { ParserNode, Root } from './node';
export class Parser {
  public tokens: Token[];
  public currentTokenIndex: number = 0;
  public get currentToken() {
    return this.tokens[this.currentTokenIndex];
  }
  public stack: ParserNode[] = [new Root()];
  public constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  public error(message: string) {
    const location = this.currentToken.start;
    return new CSSSyntaxError(location, message);
  }
  public step() {
    this.currentTokenIndex++;
  }
  public allowWhiteSpace() {
    while (this.currentToken.type === TokenType.WHITESPACE) {
      this.step();
    }
  }
  public comsumeDecalaration() {
    // const startToken = ''
    // const declaration = new Declaration();
    // declaration.start = this.currentToken.start;
    // declaration.name = new ParserNode();
    // this.allowWhiteSpace();
    // if (this.currentToken.type === TokenType.COLUMN) {
    //   return null;
    //   // throw this.error(MessageCollection._SHOULD_NOT_BE_COLON_());
    // }
    // this.step();
    // declaration.raw =
  }
  public parseDeclaration() {}
}
