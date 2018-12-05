import { MessageCollection } from '@aftercss/shared';
import { Token, TokenType } from '@aftercss/tokenizer';
import { TokenReader } from './../stream-token/token-reader';
import { CSSSyntaxError } from './parser-error';
import { AtRule, Block, Declaration, Func, ParserNode, QualifiedRule, Root } from './parser-node';
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

  /**
   * parse a stylesheet
   * https://www.w3.org/TR/css-syntax-3/#parse-a-stylesheet
   */
  public parseStyleSheet() {
    this.topLevel = true;
    const rules = this.consumeRuleList();
    const root = new Root();
    root.childNodes = rules;
    return root;
  }

  /**
   * parse a list of rule
   * https://www.w3.org/TR/css-syntax-3/#parse-a-list-of-rules
   */
  public parseRuleList() {
    this.topLevel = false;
    return this.consumeRuleList();
  }

  /**
   * parse a rule. Parse text into a single rule
   * https://www.w3.org/TR/css-syntax-3/#parse-a-rule
   */
  public parseRule() {
    let rule: AtRule | QualifiedRule;
    this.allowWhiteSpace();

    switch (this.currentToken().type) {
      case TokenType.EOF:
        return this.error('Encounter <EOF-token> when parsing a rule');
      case TokenType.ATKEYWORD:
        rule = this.consumeAtRule();
        break;
      default:
        rule = this.consumeQualifiedRule();
        if (!rule) {
          return this.error('No rule to return when parsing a rule');
        }
    }
    this.allowWhiteSpace();
    if (this.currentToken().type === TokenType.EOF) {
      return rule;
    }
    return this.error('Unexpected ending when parsing a rule');
  }

  /**
   * parse a declaration. Used in `@supports`
   * https://www.w3.org/TR/css-syntax-3/#parse-a-declaration
   */
  public parseDeclaration() {
    this.allowWhiteSpace();
    if (this.currentToken().type !== TokenType.IDENT) {
      return this.error('Declaration in `@support` should start with a <IDENT-token>');
    }
    // TODO consumeDeclaration
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
          atRuleNode.prelude.push(this.consumeComponent());
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
   * consume a declaration
   * https://www.w3.org/TR/css-syntax-3/#consume-a-declaration
   */
  // private consumeDeclaration() {
  //   const declNode = new Declaration();
  //   declNode.name = this.currentToken().content;
  //   this.step();
  //   if (this.currentToken().type === TokenType.WHITESPACE) {
  //     this.allowWhiteSpace();
  //   }
  //   if (this.currentToken().type !== TokenType.COLON) {
	// 		return null;
	// 	}
  //   this.step(); // consume <COLON-token>
  //   // TODO: a puzzle
  //   // While the current input token is anything other than an <EOF-token> ??? 为啥是EOF？
  // }

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
          break;
        case TokenType.CDO:
        case TokenType.CDC:
          if (this.topLevel) {
            this.step();
          } else {
            const qualified = this.consumeQualifiedRule();
            if (qualified) {
              rules.push(qualified);
            }
          }
          break;
        case TokenType.ATKEYWORD:
          rules.push(this.consumeAtRule());
          break;
        default:
          const qualifiedRule = this.consumeQualifiedRule();
          if (qualifiedRule) {
            rules.push(qualifiedRule);
          }
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
          return null;
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
