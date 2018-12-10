import { MessageCollection } from '@aftercss/shared';
import { Token, TokenReader, TokenType } from '@aftercss/tokenizer';
import { CSSSyntaxError } from './parser-error';
import { CommentNode, Declaration, ParserNode, Root } from './parser-node';
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
    while (this.currentToken() && this.currentToken().type === TokenType.WHITESPACE) {
      whiteSpace += this.currentToken().raw;
      this.step();
    }
    return { start: whiteSpaceStart, space: whiteSpace };
  }

  /**
   * parse a stylesheet
   */
  public parseStyleSheet() {
    this.topLevel = true;
    const rules = this.consumeRuleList();
    const root = new Root();
    root.childNodes = rules;
    return root;
  }

  /**
   * consume a list of rules
   */
  private consumeRuleList(): ParserNode[] {
    const childNodes: ParserNode[] = [];
    while (this.currentToken().type !== TokenType.EOF) {
      switch (this.currentToken().type) {
        case TokenType.WHITESPACE:
          this.step();
          break;
        case TokenType.CDO:
        case TokenType.CDC:
          if (this.topLevel) {
            this.step();
          }
          break;
        case TokenType.COMMENT:
          childNodes.push(new CommentNode(this.currentToken().content));
          break;
        case TokenType.ATKEYWORD:
          // childNodes.push(this.consumeAtRule());
          break;
        default:
          // TODO
          // qualified rule OR declaration
          childNodes.push(this.other());
      }
    }
    return childNodes;
  }

  private other() {
    const tokens: Token[] = [];
    while (true) {
      const currentToken = this.currentToken();
      if (currentToken.type === TokenType.SEMI || currentToken.type === TokenType.EOF) {
        // consume a declaration
        if (currentToken.type === TokenType.SEMI) {
          this.step();
        }
        return this.consumeDeclaration(tokens);
      }
      if (currentToken.type === TokenType.LEFT_CURLY_BRACKET) {
        // consume a qualified rule
        break;
      }
      tokens.push(currentToken);
      this.step();
    }
  }

  /**
   * consume a declaration
   */

  private consumeDeclaration(tokens: Token[]) {
    const parser = new Parser(tokens);
    if (parser.currentToken().type !== TokenType.IDENT) {
      throw this.error('Invalid declaration');
    }
    const declNode = new Declaration();
    declNode.name = parser.currentToken().content;
    declNode.source.raw += parser.currentToken().raw;
    parser.step();
    if (parser.currentToken() && parser.currentToken().type === TokenType.WHITESPACE) {
      declNode.source.raw += parser.allowWhiteSpace().space;
    }
    if (!parser.currentToken() || parser.currentToken().type !== TokenType.COLON) {
      throw this.error('Invalid declaration');
    }
    parser.step();
    declNode.source.raw += ':';
    while (true) {
      const currentToken = parser.currentToken();
      parser.step();
      if (!currentToken) {
        break;
      }
      if (currentToken.type !== TokenType.COMMENT && currentToken.type !== TokenType.WHITESPACE) {
        declNode.value.push(currentToken);
      }
      declNode.source.raw += currentToken.raw;
    }
    if (declNode.value.length < 2) {
      return declNode;
    }
    const lastToken = declNode.value.pop();
    const beforeLastToken = declNode.value.pop();
    if (beforeLastToken.content === '!' && lastToken.content.toLowerCase() === 'important') {
      declNode.important = true;
    } else {
      declNode.value.push(beforeLastToken, lastToken);
    }
    return declNode;
  }
}
