import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token, TokenType } from '@aftercss/tokenizer';
import { Parser } from './parser';
import { Comment, Declaration, IDeclarationRaw, IRuleRaw, ParserNode, Root, Rule } from './parser-node';
import { CharsetAtRule, ImportAtRule, NamespaceAtRule } from './parser-node/at-rule';
/**
 * Generate AST from Tokens
 */
export class CSSParser extends Parser {
  public topLevel: boolean = true;

  public constructor(tokensOrTokenizer: Token[] | CSSTokenizer) {
    super(tokensOrTokenizer);
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
          beforeChildNode = this.currentToken().raw;
          this.step();
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
          beforeChildNodes.push(beforeChildNode);
          beforeChildNode = '';
          childNodes.push(this.consumeAtRule());
          break;
        default:
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

  /**
   * consume an at-rule
   */
  private consumeAtRule() {
    const name = this.currentToken().content;
    this.step();
    switch (name) {
      case 'charset':
        return this.consumeCharsetAtRule();
      case 'import':
        return this.consumeImportAtRule();
      case 'namespace':
        return this.consumeNamespaceAtRule();
    }
  }

  /**
   * consume charset-at-rule
   */
  private consumeCharsetAtRule() {
    const charsetAtRule = new CharsetAtRule();
    let toMove = '';
    while (true) {
      const currentToken = this.currentToken();
      this.step();
      switch (currentToken.type) {
        case TokenType.COMMENT:
        case TokenType.WHITESPACE:
          toMove += currentToken.raw;
          break;
        case TokenType.SEMI:
          toMove += currentToken.raw;
          charsetAtRule.raw.besidesValues.push(toMove);
          return charsetAtRule;
        case TokenType.EOF:
          if (toMove !== '') {
            charsetAtRule.raw.besidesValues.push(toMove);
          }
          break;
        case TokenType.STRING:
          if (charsetAtRule.value === undefined && currentToken.raw[0] === '"') {
            charsetAtRule.value = currentToken.raw;
            if (toMove !== '') {
              charsetAtRule.raw.besidesValues.push(toMove);
              toMove = '';
            }
            charsetAtRule.raw.besidesValues.push(undefined);
          } else {
            throw this.error(MessageCollection._INVALID_CHARSET_AT_RULE_('invalid @charset value'));
          }
          break;
        default:
          throw this.error(MessageCollection._INVALID_CHARSET_AT_RULE_('encounter unexpected tokens'));
      }
    }
  }

  /**
   * consume import-at-rule
   */
  private consumeImportAtRule() {
    const importAtRuleNode = new ImportAtRule();
    let toMove = '';
    let mediaQuery = '';
    while (true) {
      const currentToken = this.currentToken();
      this.step();
      if (importAtRuleNode.value.length === 0) {
        switch (currentToken.type) {
          case TokenType.COMMENT:
          case TokenType.WHITESPACE:
            toMove += currentToken.raw;
            break;
          case TokenType.SEMI:
            toMove += currentToken.raw;
          case TokenType.EOF:
            if (toMove !== '') {
              importAtRuleNode.raw.besidesValues.push(toMove);
            }
            return importAtRuleNode;
          case TokenType.STRING:
          case TokenType.URL:
            if (toMove !== '') {
              importAtRuleNode.raw.besidesValues.push(toMove);
              toMove = '';
            }
            importAtRuleNode.value.push(currentToken.raw);
            importAtRuleNode.raw.besidesValues.push(undefined);
            break;
          default:
            throw this.error(MessageCollection._INVALID_IMPORT_AT_RULE_('encountering invalid url'));
        }
      } else {
        switch (currentToken.type) {
          case TokenType.COMMENT:
          case TokenType.WHITESPACE:
            toMove += currentToken.raw;
            break;
          case TokenType.SEMI:
            toMove += currentToken.raw;
          case TokenType.EOF:
            if (mediaQuery !== '') {
              importAtRuleNode.value.push(mediaQuery);
              importAtRuleNode.raw.besidesValues.push(undefined);
            }
            if (toMove !== '') {
              importAtRuleNode.raw.besidesValues.push(toMove);
            }
            return importAtRuleNode;
          default:
            if (mediaQuery === '') {
              importAtRuleNode.raw.besidesValues.push(toMove);
              toMove = '';
            }
            mediaQuery += toMove + currentToken.raw;
            toMove = '';
        }
      }
    }
  }

  /**
   * consume namespace-at-rule
   */
  private consumeNamespaceAtRule() {
    const namespaceAtRuleNode = new NamespaceAtRule();
    let toMove = '';
    while (true) {
      const currentToken = this.currentToken();
      this.step();
      switch (currentToken.type) {
        case TokenType.COMMENT:
        case TokenType.WHITESPACE:
          toMove += currentToken.raw;
          break;
        case TokenType.SEMI:
          toMove += currentToken.raw;
        case TokenType.EOF:
          if (toMove !== '') {
            namespaceAtRuleNode.raw.besidesValues.push(toMove);
          }
          return namespaceAtRuleNode;
        case TokenType.IDENT:
          if (namespaceAtRuleNode.value.length === 0) {
            if (toMove !== '') {
              namespaceAtRuleNode.raw.besidesValues.push(toMove);
              toMove = '';
            }
            namespaceAtRuleNode.value.push(currentToken.raw);
            namespaceAtRuleNode.raw.besidesValues.push(undefined);
            break;
          }
          throw this.error(MessageCollection._INVALID_NAMESPACE_AT_RULE_('invalid url'));
        case TokenType.STRING:
        case TokenType.URL:
          if (toMove !== '') {
            namespaceAtRuleNode.raw.besidesValues.push(toMove);
            toMove = '';
          }
          namespaceAtRuleNode.value.push(currentToken.raw);
          namespaceAtRuleNode.raw.besidesValues.push(undefined);
          break;
        default:
          throw this.error(MessageCollection._INVALID_NAMESPACE_AT_RULE_('encouter an unexpected token'));
      }
    }
  }

  /**
   * consume a declaration or a rule
   */
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
    const parser = new CSSParser(tokens);
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
   * consume a qualified rule
   */
  private consumeRule(tokens: Token[]) {
    if (tokens.length === 0) {
      throw this.error('No selector exists in a qualified rule');
    }
    const selectors: string[] = [];
    const beforeOpenBracket: string[] = [];
    const parser = new CSSParser(tokens);
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
