import { BaseParser } from '../base';
import {
  AndContainer,
  AndItem,
  BaseRule,
  OrContainer,
  RootRule,
  Rule,
  RuleType,
  StringRule,
  SubRule,
} from '../rule/rule';
import { AtomicFunction } from './atomic';
import { BaseToken, ItemToken, JoinToken, OrToken, StringToken, SubToken, Token } from './code-tokens';

/**
 * 用 Parser 生成 Token
 * 将规则的语法树向 style 铺平
 */
export class CodeParser extends BaseParser {
  public tokens: Token[] = [];
  public name: string;
  public rules: Record<string, RootRule> = {};
  public constructor(name: string, content: string, rules: Record<string, RootRule>) {
    super(content);
    this.rules = rules;
    this.name = name;
  }
  public addToken(token: Token) {
    this.tokens.push(token);
  }
  public loadRule(name: string) {
    const rootRule = this.rules[name];
    if (!rootRule) {
      throw new Error(`${name} 不存在`);
    } else {
      return rootRule;
    }
  }
  public parse() {
    return this.matchRootRule(this.loadRule(this.name));
  }
  public matchRule(rule: Rule): false | Token {
    /**
     * Root 不能走到这
     */
    switch (rule.type) {
      case RuleType.STRING:
        return this.matchStringRule(rule as StringRule);
      case RuleType.BASE:
        return this.matchBaseRule(rule as BaseRule);
      case RuleType.SUB:
        return this.matchSubRule(rule as SubRule);
      case RuleType.AND_CONTAINER:
        return this.matchJoinContainer(rule as AndContainer);
      case RuleType.OR_CONTAINER:
        return this.matchOrContainer(rule as OrContainer);
      case RuleType.OR_ITEM:
      case RuleType.AND_ITEM:
        return this.matchItem(rule as AndItem);
      case RuleType.ROOT:
        throw new Error('root rule not going here');
      default:
        throw new Error('unknown rule');
    }
  }
  public matchOrContainer(rule: OrContainer) {
    const start = this.current;
    let token: Token;
    for (const childRule of rule.childRule) {
      this.goTo(start);
      const joinRule = childRule as AndItem;
      const itemToken = this.matchRule(joinRule);
      if (itemToken !== false) {
        token = itemToken;
        const orToken = new OrToken();
        orToken.start = start;
        orToken.end = this.current;
        orToken.token = token;
        return orToken;
      }
    }
  }
  /**
   * 遇到一个join join要求所有的规则都必须匹配成功，token 中记录所有 token
   * @param rule
   */
  public matchJoinContainer(rule: AndContainer) {
    const start = this.current;
    const tokens: Token[] = [];
    for (const childRule of rule.childRule) {
      this.goTo(start);
      const joinRule = childRule as AndItem;
      const itemToken = this.matchRule(joinRule);
      if (itemToken === false) {
        return false;
      }
      tokens.push(itemToken);
    }
    const joinToken = new JoinToken();
    joinToken.start = start;
    joinToken.end = this.current;
    joinToken.tokens = tokens;
    return joinToken;
  }
  /**
   * join item 和 or item 都走到这
   * @param rule
   */
  public matchItem(rule: AndItem) {
    const tokens: Token[] = [];
    const start = this.current;
    for (const childRule of rule.childRule) {
      const token = this.matchRule(childRule);
      if (token === false) {
        return false;
      }
      tokens.push(token);
    }
    const iToken = new ItemToken();
    iToken.tokens = tokens;
    iToken.start = start;
    iToken.end = this.current;
    return iToken;
  }
  /**
   * 遇到一个stringRule
   * @param rule
   */
  public matchStringRule(rule: StringRule): false | StringToken {
    const start = this.current;
    const success = this.eat(rule.str);
    if (!success) {
      return false;
    }
    const stringToken = new StringToken();
    stringToken.start = start;
    stringToken.end = this.current;
    return stringToken;
  }
  /**
   * 遇到一个baseRule
   * @param rule
   */
  public matchBaseRule(rule: BaseRule): false | BaseToken {
    const start = this.current;
    const baseRuleName = rule.name;
    const baseRuleFunc = AtomicFunction[`$${baseRuleName}`];
    const baseRes = baseRuleFunc(this);
    if (!baseRes) {
      return false;
    }
    this.step(baseRes.length);
    const baseToken = new BaseToken();
    baseToken.name = baseRuleName;
    baseToken.start = start;
    baseToken.end = this.current;
    return baseToken;
  }
  /**
   * 用户Root
   * @param rule
   */
  public matchRootRule(rule: RootRule): false | Token[] {
    const tokens: Token[] = [];
    for (const childRule of rule.childRule) {
      const token = this.matchRule(childRule);
      if (token === false) {
        return false;
      } else {
        tokens.push(token);
      }
    }
    return tokens;
  }
  /**
   * 遇到一个用户子规则
   * @param rule
   */
  public matchSubRule(rule: SubRule): false | SubToken {
    const start = this.current;
    try {
      const subRootRes = this.matchRootRule(this.loadRule(rule.name));
      if (subRootRes === false) {
        return false;
      }
    } catch (e) {
      return false;
    }
    const subToken = new SubToken();
    subToken.start = start;
    subToken.end = this.current;
    subToken.name = rule.name;
    return subToken;
  }
}
