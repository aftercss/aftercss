// tslint:disable max-classes-per-file

export enum RuleType {
  ANY = 'ANY',
  SUB = 'SUB',
  BASE = 'BASE',
  ROOT = 'ROOT',
  OPTIONAL = 'OPTIONAL',
  STRING = 'STRING',
  OR_ITEM = 'OR_ITEM',
  OR_CONTAINER = 'OR_CONTAINER',
  AND_ITEM = 'AND_ITEM',
  AND_CONTAINER = 'AND_CONTAINER',
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

export class AndItem extends Rule {
  public type = RuleType.AND_ITEM;
  public childRule: Rule[] = [];
}
export class StringRule extends Rule {
  public type = RuleType.STRING;
  public str: string;
}
export class AndContainer extends Rule {
  public type = RuleType.AND_CONTAINER;
  public childRule: Rule[] = [];
}
export class OrContainer extends Rule {
  public type = RuleType.OR_CONTAINER;
  public childRule: Rule[] = [];
}
export class OrItem extends Rule {
  public type = RuleType.OR_ITEM;
  public childRule: Rule[] = [];
}
export type ContainerRule = RootRule | OptionalRule | AndItem;
