import { MessageCollection } from '@aftercss/shared';
import { Token, TokenType } from '@aftercss/tokenizer';
import { TokenReader } from './../stream-token/token-reader';
import { CSSSyntaxError } from './parser-error';
import { AtRule, Block, Func, ParserNode, QualifiedRule, Root } from './parser-node';
/**
 * Generate AST from Tokens
 */
export class Parser extends TokenReader {
  public topLevel: boolean = true;
  /**
   * generate CSSSyntaxError with location infos
   * @param message
   */
  public error(message: string) {
    const location = this.currentToken().start;
    return new CSSSyntaxError(location, message);
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
    this.topLevel = true;
    const rules = this.consumeRuleList();
    const root = new Root();
    root.childNodes = rules;
    return root;
  }

  /**
   * parse a list of component values
   * https://www.w3.org/TR/css-syntax-3/#parse-a-list-of-component-values
   */
  public parseComponentList() {
    while (true) {}
  }

  /**
   * consume an at-rule
   * https://www.w3.org/TR/css-syntax-3/#consume-an-at-rule
   */
  private consumeAtRule() {
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
          atRuleNode.addChild(this.consumeComponent());
      }
    }
  }
  /**
   * consume a component value
   * https://www.w3.org/TR/css-syntax-3/#consume-a-component-value
   */
  private consumeComponent(): Func | Block | Token {
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

  private consumeFunction() {
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
          funcNode.addChild(this.consumeComponent());
      }
    }
  }

  /**
   * consume a list of rules
   * https://www.w3.org/TR/css-syntax-3/#consume-a-list-of-rules
   */
  private consumeRuleList(): ParserNode[] {
    const rules: ParserNode[] = [];
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
          rules.push(this.consumeAtRule());
          break;
        default:
          rules.push(this.consumeQualifiedRule());
      }
    }
    return rules;
  }

  /**
   * consume a qualified rule
   * https://www.w3.org/TR/css-syntax-3/#consume-a-qualified-rule
   */
  private consumeQualifiedRule() {
    const qualifiedRuleNode = new QualifiedRule();
    while (true) {
      switch (this.currentToken().type) {
        case TokenType.EOF:
          throw this.error('Encounter <EOF-token> when parsering a qualified rule');
        case TokenType.LEFT_CURLY_BRACKET:
          qualifiedRuleNode.block = this.consumeSimpleBlock();
          return qualifiedRuleNode;
        // TODO simpe block with an associated token of <{-token>
        // case simple-block:
        default:
          qualifiedRuleNode.prelude.push(this.consumeComponent());
      }
    }
  }

  /**
   * consume a simple block
   * https://www.w3.org/TR/css-syntax-3/#consume-a-simple-block
   */
  private consumeSimpleBlock() {
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
          blockNode.addChild(this.consumeComponent());
      }
    }
  }
}
