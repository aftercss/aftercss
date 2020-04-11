import { MessageCollection } from '@aftercss/shared';
import { CSSTokenizer, Token, TokenType } from '@aftercss/tokenizer';
import { AtRule, Comment, EAtRuleName, EParserNodeType, ParserNode, Rule } from '../parser-node/';
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
   * @param node   the parent node of the rule
   */
  public consumeRuleList(node: ParserNode = this.root): IChildNodesRaw {
    const beforeChildNodes: string[] = [];
    const childNodes: ParserNode[] = [];
    let beforeChildNode: string = '';
    while (
      (node.type === EParserNodeType.Root && this.currentToken().type !== TokenType.EOF) ||
      (node.type !== EParserNodeType.Root &&
        this.currentToken().type !== TokenType.RIGHT_CURLY_BRACKET &&
        this.currentToken().type !== TokenType.EOF)
    ) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.WHITESPACE:
          beforeChildNode = currentToken.raw;
          this.step();
          break;
        case TokenType.CDO:
        case TokenType.CDC:
          this.step();
          break;
        case TokenType.COMMENT:
          beforeChildNodes.push(beforeChildNode);
          const commentNode = new Comment(currentToken.raw);
          commentNode.parent = node;
          commentNode.start = currentToken.start;
          childNodes.push(commentNode);
          beforeChildNode = '';
          this.step();
          break;
        case TokenType.ATKEYWORD:
          beforeChildNodes.push(beforeChildNode);
          beforeChildNode = '';
          const atRuleNode = this.consumeAtRule();
          atRuleNode.parent = node;
          childNodes.push(atRuleNode);
          break;
        default:
          // qualified rule OR declaration
          beforeChildNodes.push(beforeChildNode);
          beforeChildNode = '';
          const otherNode = this.other();
          otherNode.parent = node;
          childNodes.push(otherNode);
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
    // 不在 at-rule 的支持列表怎么办？
    const name: EAtRuleName = this.currentToken().content as EAtRuleName;
    if (EAtRuleName[name]) {
      return this.consumeCertianAtRule(EAtRuleName[name]);
    } else {
      throw this.error(MessageCollection._UNEXPECTED_AT_RULE_(`@${name} is not support`));
    }
  }

  /**
   * @param type
   * @returns AtRule
   */
  private consumeCertianAtRule(type: EAtRuleName): AtRule {
    const atRuleNode = new AtRule(type);
    atRuleNode.start = this.currentToken().start;
    this.step(); // skip the at-rule name
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
        }
        atRuleNode.raw.besidesParams.push(toMove);
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
          }
          atRuleNode.raw.besidesParams.push(toMove);
          return atRuleNode;
        default:
          if (query === '') {
            atRuleNode.raw.besidesParams.push(toMove);
            toMove = '';
          }
          query += toMove + currentToken.raw;
          toMove = '';
      }
    }
    const ruleList = this.consumeRuleList(atRuleNode);
    atRuleNode.childNodes = ruleList.childNodes;
    atRuleNode.raw.beforeChildNodes = ruleList.beforeChildNodes;
    if (this.currentToken().type !== TokenType.RIGHT_CURLY_BRACKET) {
      throw this.error(MessageCollection._UNCLOSED_BLOCK_('encoutering unclosed block'));
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
    const ruleNode = new Rule(selectorRaw.selectors);
    ruleNode.start = tokens.length > 0 ? tokens[0].start : this.currentToken().start;
    ruleNode.raw.beforeOpenBracket = selectorRaw.beforeOpenBracket;
    while (true) {
      const currentToken = this.currentToken();
      switch (currentToken.type) {
        case TokenType.EOF:
          throw this.error(MessageCollection._UNCLOSED_BLOCK_('when consuming a rule'));
        case TokenType.RIGHT_CURLY_BRACKET:
          this.step();
          // {} 紧挨着，补一个beforeChildNodes
          if (ruleNode.raw.beforeChildNodes.length === 0) {
            ruleNode.raw.beforeChildNodes.push('');
          }
          return ruleNode;
        default:
          const childNodesRaw = this.consumeRuleList(ruleNode);
          ruleNode.childNodes = childNodesRaw.childNodes;
          ruleNode.raw.beforeChildNodes = childNodesRaw.beforeChildNodes;
      }
    }
  }
}
