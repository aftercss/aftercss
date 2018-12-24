import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token, TokenType } from '@aftercss/tokenizer';
import { Comment, EAtRuleName, NestedAtRule, NonNestedAtRule, ParserNode, Rule } from '../parser-node/';
import { BaseParser } from './base-parser';

export interface IChildNodesRaw {
  beforeChildNodes: string[];
  childNodes: ParserNode[];
}

/**
 * Generate AST from Tokens
 */
export class CSSParser extends BaseParser {
  public constructor(tokensOrTokenizer: Token[] | CSSTokenizer) {
    super(tokensOrTokenizer);
  }

  /**
   * consume a list of rules
   */
  public consumeRuleList(isTopLevel: boolean = true): IChildNodesRaw {
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
          this.step();
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
      case 'media':
      case 'supports':
      case 'page':
      case 'keyframes':
      case 'viewport':
      case 'font-face':
      case 'counter-style':
      case 'font-feature-values':
      case '-ms-viewport':
        return this.consumeNestedAtRule(EAtRuleName[name]);
      default:
        throw this.error(MessageCollection._UNEXPECTED_AT_RULE_());
    }
  }

  /**
   * consume nested-at-rule
   */
  private consumeNestedAtRule(type: EAtRuleName) {
    const nestedAtRuleNode = new NestedAtRule(type);
    let toMove = '';
    let query = '';
    // media query
    while (true) {
      const currentToken = this.currentToken();
      this.step();
      if (currentToken.type === TokenType.LEFT_CURLY_BRACKET) {
        if (query !== '') {
          nestedAtRuleNode.params.push(query);
          nestedAtRuleNode.raw.besidesParams.push(undefined);
        }
        if (toMove !== '') {
          nestedAtRuleNode.raw.besidesParams.push(toMove);
        }
        break;
      }
      switch (currentToken.type) {
        case TokenType.COMMENT:
        case TokenType.WHITESPACE:
          toMove += currentToken.raw;
          break;
        case TokenType.EOF:
          throw this.error(MessageCollection._INVALID_MEDIA_AT_RULE_('expected { in @media rule'));
        default:
          if (query === '' && toMove !== '') {
            nestedAtRuleNode.raw.besidesParams.push(toMove);
            toMove = '';
          }
          query += toMove + currentToken.raw;
          toMove = '';
      }
    }
    const ruleList = this.consumeRuleList(false);
    nestedAtRuleNode.childNodes = ruleList.childNodes;
    nestedAtRuleNode.raw.beforeChildNodes = ruleList.beforeChildNodes;
    if (this.currentToken().type !== TokenType.RIGHT_CURLY_BRACKET) {
      throw this.error(MessageCollection._INVALID_MEDIA_AT_RULE_('encoutering unclosed  block'));
    }
    this.step();
    return nestedAtRuleNode;
  }

  /**
   * consume charset-at-rule
   */
  private consumeCharsetAtRule() {
    const charsetAtRule = new NonNestedAtRule(EAtRuleName.charset);
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
            charsetAtRule.raw.besidesValues.push(toMove);
          }
          return charsetAtRule;
        case TokenType.STRING:
          if (charsetAtRule.value.length === 0 && currentToken.raw[0] === '"') {
            charsetAtRule.value.push(currentToken.raw);
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
    const importAtRuleNode = new NonNestedAtRule(EAtRuleName.import);
    let toMove = '';
    let mediaQuery = '';
    while (true) {
      const currentToken = this.currentToken();
      this.step();
      if (importAtRuleNode.value.length === 0) {
        // url
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
        // media-query
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
          case TokenType.LEFT_CURLY_BRACKET:
            throw this.error(MessageCollection._INVALID_IMPORT_AT_RULE_('unexpected {'));
          default:
            if (mediaQuery === '' && toMove !== '') {
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
    const namespaceAtRuleNode = new NonNestedAtRule(EAtRuleName.namespace);
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
   * consume a qualified rule
   */
  private consumeRule(tokens: Token[]) {
    const selectorRaw = this.consumeSelector(tokens);
    const rule = new Rule(selectorRaw.selectors);
    rule.raw.beforeOpenBracket = selectorRaw.beforeOpenBracket;
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.EOF:
          throw this.error(MessageCollection._UNCLOSED_BLOCK_('when consuming a rule'));
        case TokenType.RIGHT_CURLY_BRACKET:
          this.step();
          return rule;
        default:
          const childNodesRaw = this.consumeRuleList(false);
          rule.childNodes = childNodesRaw.childNodes;
          rule.raw.beforeChildNodes = childNodesRaw.beforeChildNodes;
      }
    }
  }
}
