import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token, TokenType } from '@aftercss/tokenizer';
import { AtRule, Comment, EAtRuleName, ParserNode, Rule } from '../parser-node/';
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
          childNodes.push(this.consumeAtRules());
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
  private consumeAtRules() {
    const name = this.currentToken().content;
    this.step();
    switch (name) {
      case 'charset':
      case 'import':
      case 'namespace':
      case 'media':
      case 'supports':
      case 'page':
      case 'keyframes':
      case 'viewport':
      case 'font-face':
      case 'counter-style':
      case 'font-feature-values':
      case '-ms-viewport':
        return this.consumeOneAtRule(EAtRuleName[name]);
      default:
        throw this.error(MessageCollection._UNEXPECTED_AT_RULE_());
    }
  }

  /**
   * @param type
   * @returns AtRule
   */
  private consumeOneAtRule(type: EAtRuleName): AtRule {
    const atRuleNode = new AtRule(type);
    let toMove = '';
    let query = '';
    // atrule params
    while (true) {
      const currentToken = this.currentToken();
      this.step();
      if (currentToken.type === TokenType.LEFT_CURLY_BRACKET) {
        atRuleNode.isNested = true;
        if (query !== '') {
          atRuleNode.params.push(query);
          atRuleNode.raw.besidesParams.push(undefined);
        }
        if (toMove !== '') {
          atRuleNode.raw.besidesParams.push(toMove);
        }
        break;
      }
      switch (currentToken.type) {
        case TokenType.COMMENT:
        case TokenType.WHITESPACE:
          toMove += currentToken.raw;
          break;
        case TokenType.SEMI:
          toMove += currentToken.raw;
        case TokenType.EOF:
          if (query !== '') {
            atRuleNode.params.push(query);
            atRuleNode.raw.besidesParams.push(undefined);
          }
          if (toMove !== '') {
            atRuleNode.raw.besidesParams.push(toMove);
          }
          return atRuleNode;
        default:
          if (query === '' && toMove !== '') {
            atRuleNode.raw.besidesParams.push(toMove);
            toMove = '';
          }
          query += toMove + currentToken.raw;
          toMove = '';
      }
    }
    const ruleList = this.consumeRuleList(false);
    atRuleNode.childNodes = ruleList.childNodes;
    atRuleNode.raw.beforeChildNodes = ruleList.beforeChildNodes;
    if (this.currentToken().type !== TokenType.RIGHT_CURLY_BRACKET) {
      throw this.error(MessageCollection._UNCLOSED_BLOCK_('encoutering unclosed  block'));
    }
    this.step();
    return atRuleNode;
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
