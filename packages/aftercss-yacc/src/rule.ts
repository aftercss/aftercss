// tslint:disable max-classes-per-file

export enum RuleType {
  ANY = 'ANY',
  SUB = 'SUB',
  BASE = 'BASE',
  ROOT = 'ROOT',
  OPTIONAL = 'OPTIONAL',
  JOIN = 'JOIN',
  STRING = 'STRING',
  ORCONTAINER = 'ORCONTAINER',
  ORITEM = 'ORITEM',
  JOINCONTAINER = 'JOINCONTAINER',
}
export class Rule {
  public type: RuleType;
}
export class RootRule extends Rule {
  public type: RuleType.ROOT;
  public childRule: Rule[] = [];
}
export class SubRule extends Rule {
  public type = RuleType.SUB;
  public name: string;
}
export class BaseRule extends Rule {
  public type = RuleType.BASE;
  public name: string;
}

export class OptionalRule extends Rule {
  public type = RuleType.OPTIONAL;
  public childRule: Rule[] = [];
}

export class JoinRule extends Rule {
  public type = RuleType.JOIN;
  public childRule: Rule[] = [];
}
export class StringRule extends Rule {
  public type = RuleType.STRING;
  public str: string;
}
export class JoinContainer extends Rule {
  public type = RuleType.JOINCONTAINER;
  public childRule: Rule[] = [];
}
export class OrRuleContainer extends Rule {
  public type = RuleType.ORCONTAINER;
  public childRule: Rule[] = [];
}
export class OrRuleItem extends Rule {
  public type = RuleType.ORITEM;
  public childRule: Rule[] = [];
}
export type ContainerRule = RootRule | OptionalRule | JoinRule;
