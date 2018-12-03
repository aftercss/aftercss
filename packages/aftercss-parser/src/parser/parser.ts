import { MessageCollection } from '@aftercss/shared';
import { Token, TokenType } from '@aftercss/tokenizer';
import { TokenReader } from './../stream-token/token-reader';
import { CSSSyntaxError } from './parser-error';
import { AtRule, Block, Func, ParserNode, Root } from './parser-node';
/**
 * Generate AST from Tokens
 */
export class Parser extends TokenReader {
  public currentParserNode: ParserNode = new Root();
  public stack: ParserNode[] = [this.currentParserNode];
  public topLevel: boolean = true;
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
          break;
      }
    }
  }

  /**
   * consume an at-rule
   * https://www.w3.org/TR/css-syntax-3/#consume-an-at-rule
   */
  public consumeAtRule() {
    const atRuleNode = new AtRule();
    atRuleNode.name = this.currentToken().content;
    this.step();
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.SEMI:
          this.step();
          return atRuleNode;
        case TokenType.EOF:
          return atRuleNode;
        case TokenType.LEFT_CURLY_BRACKET:
          atRuleNode.block = this.consumeSimpleBlock();
          return atRuleNode;
        // TODO simple block with an associated token of <{-token>
        // case simple-block:
        default:
          atRuleNode.prelude.push(this.consumeComponent());
      }
    }
  }
  /**
   * consume a component value
   * https://www.w3.org/TR/css-syntax-3/#consume-a-component-value
   */
  public consumeComponent(): Func | Block | Token {
    const currentToken = this.currentToken();
    switch (currentToken.type) {
      case TokenType.LEFT_CURLY_BRACKET:
      case TokenType.LEFT_PARENTHESIS:
      case TokenType.LEFT_SQUARE_BRACKET:
        return this.consumeSimpleBlock();
      case TokenType.FUNCTION:
        return this.consumeFunction();
      default:
        this.step();
        return currentToken;
    }
  }
  /**
   * consume a function
   * https://www.w3.org/TR/css-syntax-3/#consume-a-function
   */

  public consumeFunction() {
    const funcNode = new Func();
    funcNode.name = this.currentToken().content;
    this.step();
    while (true) {
      switch (this.currentToken().type) {
        case TokenType.EOF:
          return funcNode;
        case TokenType.RIGHT_PARENTHESIS:
          this.step();
          return funcNode;
        default:
          funcNode.childNodes.push(this.consumeComponent());
      }
    }
  }

  /**
   * consume a list of rules
   * https://www.w3.org/TR/css-syntax-3/#consume-a-list-of-rules
   */
  public consumeRuleList(): ParserNode[] {
    while (this.currentToken().type !== TokenType.EOF) {
      switch (this.currentToken().type) {
        case TokenType.WHITESPACE:
          this.allowWhiteSpace();
          break;
        case TokenType.CDO:
        case TokenType.CDC:
          if (this.topLevel) {
            this.step();
          }
          break;
        case TokenType.ATKEYWORD:
        // this.consumeAtRule();
        // break;
      }
    }
    return this.stack;
  }

  /**
   * consume a simple block
   * https://www.w3.org/TR/css-syntax-3/#consume-a-simple-block
   */
  public consumeSimpleBlock() {
    const blockNode = new Block();
    let currentToken = this.currentToken();
    blockNode.associatedToken = currentToken;
    this.step();
    let endingTokenType: TokenType;
    switch (currentToken.type) {
      case TokenType.LEFT_CURLY_BRACKET:
        endingTokenType = TokenType.RIGHT_CURLY_BRACKET;
        break;
      case TokenType.LEFT_PARENTHESIS:
        endingTokenType = TokenType.RIGHT_PARENTHESIS;
        break;
      case TokenType.LEFT_SQUARE_BRACKET:
        endingTokenType = TokenType.RIGHT_SQUARE_BRACKET;
        break;
    }

    while (true) {
      currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.EOF:
          return blockNode;
        case endingTokenType:
          this.step();
          return blockNode;
        default:
          blockNode.childNodes.push(this.consumeComponent());
      }
    }
  }
}
