// tslint:disable max-classes-per-file
import { EParserNodeType, ParserNode } from './node';
import { Rule } from './rule';

export enum EAtRuleName {
  keyframes = 'keyframes',
  import = 'import',
}

export enum kAtRuleRawName {
  afterName = 'afterName',
}

export type AtRuleRaw = Map<kAtRuleRawName, string>;
/**
 * atRule will be with @keyframes @import
 */
export class AtRule extends ParserNode<AtRuleRaw> {
  public type = EParserNodeType.AtRule;
  public name: EAtRuleName;
  public constructor(name: EAtRuleName) {
    super();
  }
}

export class ImportAtRule extends AtRule {
  constructor() {
    super(EAtRuleName.import);
  }
}

export class KeyframesAtRule extends AtRule {
  public children: Rule[] = [];
  constructor() {
    super(EAtRuleName.keyframes);
  }
}
