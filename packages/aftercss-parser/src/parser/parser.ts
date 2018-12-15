import { MessageCollection } from '@aftercss/shared';
import { Token, TokenReader, TokenType } from '@aftercss/tokenizer';
import { CSSSyntaxError } from './parser-error';
import { Comment, Declaration, IDeclarationRaw, IRuleRaw, ParserNode, Root, Rule } from './parser-node';
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
    const ruleList = this.consumeRuleList();
    const root = new Root();
    root.childNodes = ruleList.childNodes;
    root.raw.beforeChildNodes = ruleList.beforeChildNodes;
    return root;
  }

  /**
   * consume a list of rules
   */
  private consumeRuleList(
    isTopLevel: boolean = true,
  ): {
    beforeChildNodes: string[];
    childNodes: ParserNode[];
  } {
    const beforeChildNodes: string[] = [];
    const childNodes: ParserNode[] = [];
    let beforeChildNode: string = '';
    while (
      (isTopLevel && this.currentToken().type !== TokenType.EOF) ||
      (!isTopLevel &&
        this.currentToken().type !== TokenType.RIGHT_CURLY_BRACKET &&
        this.currentToken().type !== TokenType.EOF)
    ) {
      switch (this.currentToken().type) {
        case TokenType.WHITESPACE:
          beforeChildNode = this.allowWhiteSpace().space;
          break;
        case TokenType.CDO:
        case TokenType.CDC:
          if (this.topLevel) {
            this.step();
          }
          break;
        case TokenType.COMMENT:
          beforeChildNodes.push(beforeChildNode);
          childNodes.push(new Comment(this.currentToken().raw));
          beforeChildNode = '';
          this.step();
          break;
        case TokenType.ATKEYWORD:
          // childNodes.push(this.consumeAtRule());
          break;
        default:
          // TODO
          // qualified rule OR declaration
          beforeChildNodes.push(beforeChildNode);
          beforeChildNode = '';
          childNodes.push(this.other());
      }
    }
    beforeChildNodes.push(beforeChildNode);
    return {
      beforeChildNodes,
      childNodes,
    };
  }

  private other() {
    const tokens: Token[] = [];
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.SEMI:
          tokens.push(currentToken);
        case TokenType.EOF:
          this.step();
          return this.consumeDeclaration(tokens);
        case TokenType.RIGHT_CURLY_BRACKET:
          if (tokens.length !== 0) {
            return this.consumeDeclaration(tokens);
          }
          throw this.error(MessageCollection._UNEXPECTED_RIGHT_CURLY_BRACKET_());
        case TokenType.LEFT_CURLY_BRACKET:
          this.step();
          return this.consumeRule(tokens);
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
      throw this.error(MessageCollection._INVALID_DECLARATION_('unexpected prop'));
    }
    const prop: string = parser.currentToken().raw;
    const value: string[] = [];
    const raw: IDeclarationRaw = {
      afterColon: [],
      beforeColon: '',
    };
    parser.step();
    while (true) {
      const currentToken = parser.currentToken();
      if (
        currentToken.type === TokenType.COLON ||
        currentToken.type === TokenType.EOF ||
        currentToken.type === TokenType.SEMI
      ) {
        break;
      }
      raw.beforeColon += currentToken.raw;
      parser.step();
    }
    if (parser.currentToken().type !== TokenType.COLON) {
      throw this.error(MessageCollection._INVALID_DECLARATION_('expect a colon in a declaration'));
    }
    parser.step();
    let toMove = '';
    while (parser.currentToken().type !== TokenType.EOF) {
      const currentToken = parser.currentToken();
      switch (currentToken.type) {
        case TokenType.COMMENT:
        case TokenType.SEMI:
        case TokenType.WHITESPACE:
          toMove += currentToken.raw;
          parser.step();
          break;
        case TokenType.FUNCTION:
          const functionNode = parser.consumeFunction();
          if (toMove !== '') {
            raw.afterColon.push(toMove);
            toMove = '';
          }
          raw.afterColon.push(undefined);
          value.push(functionNode);
          break;
        default:
          if (toMove !== '') {
            raw.afterColon.push(toMove);
            toMove = '';
          }
          value.push(currentToken.raw);
          raw.afterColon.push(undefined);
          parser.step();
      }
    }
    if (toMove !== '') {
      raw.afterColon.push(toMove);
      toMove = '';
    }
    const declNode = new Declaration(prop, value, false);
    declNode.raw = raw;
    if (value.length < 2) {
      return declNode;
    }
    const last = declNode.value.pop();
    const beforeLast = declNode.value.pop();
    if (beforeLast.toLowerCase() === '!' && last.toLowerCase() === 'important') {
      declNode.important = true;
      let cnt = 0;
      let concatStr = '';
      for (let i = raw.afterColon.length - 1; i > -1; i--) {
        if (raw.afterColon[i] === undefined) {
          cnt++;
        } else {
          concatStr = raw.afterColon[i] + concatStr;
        }
        if (cnt === 1) {
          concatStr = 'important' + concatStr;
        }
        if (cnt === 2) {
          concatStr = '!' + concatStr;
          if (raw.afterColon[i - 1] !== undefined) {
            i = i - 1;
            concatStr = raw.afterColon[i] + concatStr;
          }
          raw.afterColon.splice(i, raw.afterColon.length - i, concatStr);
          break;
        }
      }
    } else {
      declNode.value.push(beforeLast, last);
    }
    return declNode;
  }

  /**
   * consume a function Node
   */
  private consumeFunction() {
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
  private consumeSquareBracket() {
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

  /**
   * consume a qualified rule
   */
  private consumeRule(tokens: Token[]) {
    if (tokens.length === 0) {
      throw this.error('No selector exists in a qualified rule');
    }
    const selectors: string[] = [];
    const beforeOpenBracket: string[] = [];
    const parser = new Parser(tokens);
    let selector = '';
    let toMove = '';
    while (parser.currentToken().type !== TokenType.EOF) {
      const currentToken = parser.currentToken();
      parser.step();
      switch (currentToken.type) {
        case TokenType.COMMENT:
        case TokenType.WHITESPACE:
          toMove += currentToken.raw;
          break;
        case TokenType.COMMA:
          selectors.push(selector);
          const nextToken = parser.currentToken();
          toMove += ',';
          if (nextToken.type === TokenType.COMMENT || nextToken.type === TokenType.WHITESPACE) {
            toMove += nextToken.raw;
            parser.step();
          }
          beforeOpenBracket.push(undefined, toMove);
          toMove = '';
          selector = '';
          break;
        default:
          selector += toMove + currentToken.raw;
          toMove = '';
      }
    }
    if (selector !== '') {
      selectors.push(selector);
      beforeOpenBracket.push(undefined);
    }
    if (toMove !== '') {
      beforeOpenBracket.push(toMove);
    }
    const rule = new Rule(selectors);
    rule.raw.beforeOpenBracket = beforeOpenBracket;
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.EOF:
          throw this.error(MessageCollection._UNCLOSED_BLOCK_('when consuming a rule'));
        case TokenType.RIGHT_CURLY_BRACKET:
          this.step();
          return rule;
        default:
          const list = this.consumeRuleList(false);
          rule.childNodes = list.childNodes;
          rule.raw.beforeChildNodes = list.beforeChildNodes;
      }
    }
  }
}
