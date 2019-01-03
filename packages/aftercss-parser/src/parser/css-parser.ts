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
          commentNode.start = currentToken.start;
          childNodes.push(commentNode);
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
   * stringify AST-tree
   * @param node
   */
  public stringify(node: ParserNode): string {
    let res: string = '';
    switch (node.type) {
      case EParserNodeType.AtRule:
        if (node.checkType(EParserNodeType.AtRule)) {
          // at-rule name
          res += `@${node.name}`;
          // at-rule params
          let paramsIndex = 0;
          node.raw.besidesParams.forEach(item => {
            if (item === undefined) {
              res += node.params[paramsIndex];
              paramsIndex++;
            } else {
              res += item;
            }
          });
          if (node.isNested) {
            res += '{';
            for (let i = 0; i < node.childNodes.length; i++) {
              res += node.raw.beforeChildNodes[i];
              res += this.stringify(node.childNodes[i]);
            }
            res += node.raw.beforeChildNodes[node.childNodes.length] + '}';
          }
        }
        break;
      case EParserNodeType.Comment:
        if (node.checkType(EParserNodeType.Comment)) {
          res += node.content;
        }
        break;
      case EParserNodeType.Declaration:
        if (node.checkType(EParserNodeType.Declaration)) {
          res += node.prop + node.raw.beforeColon + ':';
          let valueIndex = 0;
          node.raw.afterColon.forEach(item => {
            if (item === undefined) {
              res += node.value[valueIndex];
              valueIndex++;
            } else {
              res += item;
            }
          });
        }
        break;
      case EParserNodeType.Root:
        if (node.checkType(EParserNodeType.Root)) {
          for (let i = 0; i < node.childNodes.length; i++) {
            res += node.raw.beforeChildNodes[i];
            res += this.stringify(node.childNodes[i]);
          }
          res += node.raw.beforeChildNodes[node.childNodes.length];
        }
        break;
      case EParserNodeType.Rule:
        if (node.checkType(EParserNodeType.Rule)) {
          let selectorIndex = 0;
          node.raw.beforeOpenBracket.forEach(item => {
            if (item === undefined) {
              res += node.selector[selectorIndex];
              selectorIndex++;
            } else {
              res += item;
            }
          });
          res += '{';
          for (let i = 0; i < node.childNodes.length; i++) {
            res += node.raw.beforeChildNodes[i];
            res += this.stringify(node.childNodes[i]);
          }
          res += node.raw.beforeChildNodes[node.childNodes.length] + '}';
        }
        break;
    }
    return res;
  }

  /**
   * consume an at-rule
   */
  private consumeAtRules() {
    const name = this.currentToken().content;
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
          const childNodesRaw = this.consumeRuleList(false);
          ruleNode.childNodes = childNodesRaw.childNodes;
          ruleNode.raw.beforeChildNodes = childNodesRaw.beforeChildNodes;
      }
    }
  }
}
