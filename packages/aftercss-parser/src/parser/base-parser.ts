import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token, TokenReader, TokenType } from '@aftercss/tokenizer';
import { Declaration, IDeclarationRaw, ParserNode, Root } from '../parser-node';
import { CSSSyntaxError } from './parser-error';

export interface ISelectorRaw {
  beforeOpenBracket: string[]; // anything but selector before the open curly bracket, such as whitespace...
  selectors: string[]; // selectors in a rule
}

export interface IChildNodesRaw {
  beforeChildNodes: string[]; // the whilespace before childNodes
  childNodes: ParserNode[]; // the childNodes of a parserNode
}

export class BaseParser extends TokenReader {
  public root: Root = new Root();
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
   * parse a stylesheet, return the AST tree
   */
  public parseStyleSheet() {
    const childNodesRaw = this.consumeRuleList();
    this.root.childNodes = childNodesRaw.childNodes;
    this.root.raw.beforeChildNodes = childNodesRaw.beforeChildNodes;
    return this.root;
  }

  /**
   * invoked by parseStyleSheet to consume all rules in a stylesheet.
   * should be overloaded.
   * @returns IChildNodeRaw
   */
  public consumeRuleList(): IChildNodesRaw {
    throw this.error(
      MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('BaseParser.consumeRuleList', new Error().stack),
    );
  }

  /**
   * eat tokens which compose a declaration
   * @param tokens
   * @returns Declaration
   */
  public consumeDeclaration(tokens: Token[]): Declaration {
    const parser = new BaseParser(tokens);
    if (parser.currentToken().type !== TokenType.IDENT) {
      throw this.error(MessageCollection._INVALID_DECLARATION_('unexpected prop'));
    }
    const prop: string = parser.currentToken().raw;
    const start = parser.currentToken().start;
    parser.step();
    const value: string[] = [];
    const raw: IDeclarationRaw = {
      afterColon: [],
      beforeColon: '',
    };
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
    declNode.start = start;
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
        if (raw.afterColon[i] !== undefined) {
          concatStr = raw.afterColon[i] + concatStr;
          continue;
        }
        cnt++;
        if (cnt === 1) {
          concatStr = last + concatStr;
        }
        if (cnt === 2) {
          concatStr = beforeLast + concatStr;
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
   * consume a function Node.
   * @returns the raw content of a function
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
          funcNode += this.consumeBracketButCurly('square');
          break;
        case TokenType.LEFT_PARENTHESIS:
          funcNode += this.consumeBracketButCurly('square');
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
   * @param tokens
   * eat tokens which compose a rule selector
   * @returns  SelectorRaw
   */
  public consumeSelector(tokens: Token[]): ISelectorRaw {
    const selectorRaw: ISelectorRaw = {
      beforeOpenBracket: [],
      selectors: [],
    };

    if (tokens.length !== 0) {
      const parser = new BaseParser(tokens);
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
            selectorRaw.selectors.push(selector);
            toMove += ',';
            const nextToken = parser.currentToken();
            if (nextToken.type === TokenType.COMMENT || nextToken.type === TokenType.WHITESPACE) {
              toMove += nextToken.raw;
              parser.step();
            }
            selectorRaw.beforeOpenBracket.push(undefined, toMove);
            toMove = '';
            selector = '';
            break;
          case TokenType.LEFT_SQUARE_BRACKET:
            selector += toMove + currentToken.raw + parser.consumeBracketButCurly('square');
            toMove = '';
            break;
          case TokenType.LEFT_PARENTHESIS:
            selector += toMove + currentToken.raw + parser.consumeBracketButCurly('paren');
            toMove = '';
            break;
          default:
            selector += toMove + currentToken.raw;
            toMove = '';
        }
      }
      if (selector !== '') {
        selectorRaw.selectors.push(selector);
        selectorRaw.beforeOpenBracket.push(undefined);
      }
      if (toMove !== '') {
        selectorRaw.beforeOpenBracket.push(toMove);
      }
    }
    return selectorRaw;
  }

  /**
   * consume a square-bracket block or a parenthesis
   * @returns the raw content of the bracket block
   */
  public consumeBracketButCurly(type: 'square' | 'paren'): string {
    let endingType: TokenType = TokenType.RIGHT_SQUARE_BRACKET;
    if (type === 'paren') {
      endingType = TokenType.RIGHT_PARENTHESIS;
    }
    let bracketContent = this.currentToken().raw;
    this.step();
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case endingType:
          bracketContent += currentToken.raw;
          this.step();
          return bracketContent;
        case TokenType.EOF:
          throw this.error(MessageCollection._UNCLOSED_BLOCK_(`when consuming a ${type} bracket`));
        case TokenType.LEFT_PARENTHESIS:
          bracketContent += this.consumeBracketButCurly('paren');
          break;
        case TokenType.LEFT_SQUARE_BRACKET:
          bracketContent += this.consumeBracketButCurly('square');
          break;
        case TokenType.FUNCTION:
          bracketContent += this.consumeFunction();
        default:
          bracketContent += currentToken.raw;
          this.step();
      }
    }
  }

  public stringify(node: ParserNode): string {
    throw this.error(
      MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('BaseParser.stringify', new Error().stack),
    );
  }
}
