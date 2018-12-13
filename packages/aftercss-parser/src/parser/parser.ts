import { MessageCollection } from '@aftercss/shared';
import { Token, TokenReader, TokenType } from '@aftercss/tokenizer';
import { CSSSyntaxError } from './parser-error';
import { CommentNode, Declaration, FunctionNode, ParserNode, QualifiedRule, Root, SquareBracket } from './parser-node';
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
   */
  public parseStyleSheet() {
    this.topLevel = true;
    const rules = this.consumeRuleList();
    const root = new Root();
    root.childNodes = rules;
    root.source.to = this.currentToken().start;
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
          childNodes.push(new CommentNode(this.currentToken()));
          this.step();
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
      switch (currentToken.type) {
        case TokenType.COMMENT:
          this.step();
          if (tokens.length === 0) {
            return new CommentNode(currentToken);
          }
          tokens.push(currentToken);
          break;
        case TokenType.EOF:
        case TokenType.SEMI:
          this.step();
          return this.consumeDeclaration(tokens);
        case TokenType.RIGHT_CURLY_BRACKET:
          if (tokens.length !== 0) {
            return this.consumeDeclaration(tokens);
          }
          throw this.error('Unexpected {');
        case TokenType.LEFT_CURLY_BRACKET:
          this.step();
          return this.consumeQualifiedRule(tokens);
        case TokenType.WHITESPACE:
          this.step();
          break;
        default:
          this.step();
          tokens.push(currentToken);
      }
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
    declNode.prelude.push(parser.currentToken());
    declNode.source.from = parser.currentToken().start - parser.currentToken().raw.length;
    declNode.name = parser.currentToken().content;
    parser.step();
    while (parser.currentToken().type === TokenType.COMMENT) {
      declNode.prelude.push(parser.currentToken());
      parser.step();
    }
    if (parser.currentToken().type !== TokenType.COLON) {
      throw this.error('Invalid declaration');
    }
    parser.step();
    while (parser.currentToken().type !== TokenType.EOF) {
      const currentToken = parser.currentToken();
      switch (currentToken.type) {
        case TokenType.COMMENT:
          declNode.value.push(new CommentNode(currentToken));
          parser.step();
          break;
        case TokenType.FUNCTION:
          const functionNode = parser.consumeFunction();
          declNode.value.push(functionNode);
          break;
        default:
          parser.step();
          declNode.value.push(currentToken);
      }
    }
    declNode.source.to = parser.currentToken().start;
    if (declNode.value.length < 2) {
      return declNode;
    }
    const lastToken = declNode.value.pop();
    const beforeLastToken = declNode.value.pop();
    if (
      lastToken instanceof Token &&
      beforeLastToken instanceof Token &&
      beforeLastToken.content === '!' &&
      lastToken.content.toLowerCase() === 'important'
    ) {
      declNode.important = true;
    } else {
      declNode.value.push(beforeLastToken, lastToken);
    }
    return declNode;
  }

  /**
   * consume a function Node
   */
  private consumeFunction() {
    const funcNode = new FunctionNode();
    funcNode.name = this.currentToken().content;
    funcNode.source.from = this.currentToken().start - this.currentToken().raw.length;
    this.step();
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.COMMENT:
          funcNode.value.push(new CommentNode(currentToken));
          this.step();
          break;
        case TokenType.EOF:
          throw this.error('Encounter unclosed block when consuming Function Node');
        case TokenType.FUNCTION:
          const childNode = this.consumeFunction();
          funcNode.value.push(childNode);
          break;
        case TokenType.LEFT_SQUARE_BRACKET:
          funcNode.value.push(this.consumeSquareBracket());
          break;
        case TokenType.RIGHT_PARENTHESIS:
          funcNode.source.to = this.currentToken().start;
          this.step();
          return funcNode;
        case TokenType.WHITESPACE:
          this.step();
          break;
        default:
          this.step();
          funcNode.value.push(currentToken);
      }
    }
  }

  /**
   * consume a square-bracket block
   */
  private consumeSquareBracket() {
    this.step();
    const squareBracketNode = new SquareBracket();
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.LEFT_SQUARE_BRACKET:
          squareBracketNode.value.push(this.consumeSquareBracket());
          break;
        case TokenType.EOF:
          throw this.error('Encounter unclosed block when consuming a square bracker');
        case TokenType.FUNCTION:
          squareBracketNode.value.push(this.consumeFunction());
          break;
        case TokenType.RIGHT_SQUARE_BRACKET:
          this.step();
          return squareBracketNode;
        default:
          this.step();
          squareBracketNode.value.push(currentToken);
      }
    }
  }

  /**
   * consume a qualified rule
   */
  private consumeQualifiedRule(tokens: Token[]) {
    if (tokens.length === 0) {
      throw this.error('No selector exists in a qualified rule');
    }
    const rule = new QualifiedRule();
    const parser = new Parser(tokens);
    while (parser.currentToken().type !== TokenType.EOF) {
      const currentToken = parser.currentToken();
      if (currentToken.type === TokenType.FUNCTION) {
        rule.prelude.push(parser.consumeFunction());
        continue;
      }
      if (currentToken.type === TokenType.LEFT_SQUARE_BRACKET) {
        rule.prelude.push(parser.consumeSquareBracket());
        continue;
      }
      rule.prelude.push(currentToken);
      parser.step();
    }
    rule.source.from = tokens[0].start - tokens[0].raw.length;
    while (true) {
      this.allowWhiteSpace();
      const currentToken = this.currentToken();
      if (currentToken.type === TokenType.EOF) {
        throw this.error('Encountering unclosed block when consuming a qualified rule');
      }
      if (currentToken.type === TokenType.RIGHT_CURLY_BRACKET) {
        rule.source.to = this.currentToken().start;
        this.step();
        return rule;
      }
      rule.addChild(this.other());
    }
  }
}
