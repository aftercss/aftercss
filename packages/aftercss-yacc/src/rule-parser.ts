import { BaseParser } from './base-parser';
import {
  BaseRule,
  ContainerRule,
  JoinContainer,
  JoinRule,
  OptionalRule,
  OrRuleContainer,
  OrRuleItem,
  RootRule,
  Rule,
  RuleType,
  StringRule,
  SubRule,
} from './rule';
/**
 * 自己改造了一套类型检查语法
 * { & } 来做and规则
 * / 做or规则 只能在顶层Root的下面
 * [] 做optional规则
 * 'xxx' 字面量
 * $xxx 原子规则
 * %background-image 子规则校验
 */
export class RuleParser extends BaseParser {
  public rootRule: RootRule = new RootRule();
  public currentRule: ContainerRule = this.rootRule;
  public ruleStack: ContainerRule[] = [this.rootRule];
  constructor(c: string) {
    super(c);
  }
  /**
   * 当前加子rule
   * @param rule
   */
  public addRuleAsChild(rule: Rule) {
    this.currentRule.childRule.push(rule);
  }
  /**
   * 压Container的时候会有这个
   * @param rule
   */
  public pushRule(rule: ContainerRule) {
    this.ruleStack.push(rule);
    this.currentRule = rule;
  }
  /**
   * popContainer
   */
  public popRule(): ContainerRule {
    this.currentRule = this.ruleStack[this.ruleStack.length - 2];
    return this.ruleStack.pop();
  }
  public assert(b: boolean) {
    if (!b) {
      throw Error('rule parseing error');
    }
  }
  /**
   * %background-image %background-color %ws
   */
  public subRule() {
    this.step();
    const subRuleOrFunction = this.readUntil(/[^a-z\-]/i);
    const subRule = new SubRule();
    subRule.name = subRuleOrFunction;
    this.addRuleAsChild(subRule);
  }
  public func() {
    this.step();
    const subRuleOrFunction = this.readUntil(/[^a-z\-]/i);
    const baseRule = new BaseRule();
    baseRule.name = subRuleOrFunction;
    this.addRuleAsChild(baseRule);
  }
  /**
   * start `{`
   */
  public joinContainer() {
    /**
     * 开一个新的JoinContainer的池子
     */
    this.step();
    const jcRule = new JoinContainer();
    this.addRuleAsChild(jcRule);
    this.pushRule(jcRule);
    const jRule = new JoinRule();
    this.addRuleAsChild(jRule);
    this.pushRule(jRule);
  }
  /**
   * match `&`
   */
  public joinItem() {
    /**
     * 当前正在进行的应该是Join
     * 关掉正在进行的join
     * 打开一个新的join
     */
    this.step();
    this.checkStackTop(RuleType.JOIN);
    this.popRule();
    const jRule = new JoinRule();
    this.addRuleAsChild(jRule);
    this.pushRule(jRule);
  }
  public orContainer() {
    this.step();
    const ocRule = new OrRuleContainer();
    this.addRuleAsChild(ocRule);
    this.pushRule(ocRule);
    const orRule = new OrRuleItem();
    this.addRuleAsChild(orRule);
    this.pushRule(orRule);
  }
  public orItem() {
    this.step();
    this.checkStackTop(RuleType.ORITEM);
    this.popRule();
    const jRule = new OrRuleItem();
    this.addRuleAsChild(jRule);
    this.pushRule(jRule);
  }
  /**
   * 检查栈顶类型
   * @param ruleType
   */
  public checkStackTop(ruleType: RuleType) {
    this.assert(this.currentRule.type === ruleType);
  }
  /**
   * 循环入口
   */
  public parse() {
    while (!this.isEof()) {
      const current = this.pick();
      switch (current) {
        case '(':
          this.orContainer();
          break;
        case ')':
          this.step();
          this.checkStackTop(RuleType.ORITEM);
          this.popRule();
          this.checkStackTop(RuleType.ORCONTAINER);
          this.popRule();
          break;
        case '/':
          this.orItem();
          break;
        case '%':
          /* %background-image 子规则或者原子函数 %ws[空格] %*/
          this.subRule();
          break;
        case '$':
          /* %background-image 子规则或者原子函数 %ws[空格] %*/
          this.func();
          break;
        case ' ':
          this.allowWhitespace();
          break;
        case '{':
          // { %marginTop & %marginRight & %marginBottom & %marginLeft }
          this.joinContainer();
          break;
        case '&':
          this.joinItem();
          break;
        case '}':
          this.step();
          this.checkStackTop(RuleType.JOIN);
          this.popRule();
          this.checkStackTop(RuleType.JOINCONTAINER);
          this.popRule();
          break;
        case '[':
          /* 这里面的内容可以出现可以不出现 [, %backgroundRepeat ] */
          this.step();
          const orule = new OptionalRule();
          this.addRuleAsChild(orule);
          this.pushRule(orule);
          break;
        case ']':
          this.step();
          const option = this.popRule();
          if (option.type !== RuleType.OPTIONAL) {
            throw new Error(' should be option ');
          }
          break;
        case "'":
          /* 字面量 */
          this.step();
          const str = this.readUntil(/[']/i);
          this.eat("'", true);
          const stringRule = new StringRule();
          stringRule.str = str;
          this.addRuleAsChild(stringRule);
          break;
        default:
          throw Error('未知的规则类型' + current);
      }
    }
  }
}
