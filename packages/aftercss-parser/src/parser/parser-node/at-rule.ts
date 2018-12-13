// tslint:disable max-classes-per-file
import { EParserNodeType, ParserNode } from './node';
import { Rule } from './rule';

export enum EAtRuleName {
  keyframes = 'keyframes',
  import = 'import',
}

export interface IAtRuleRaw {
  afterName: string;
}
/**
 * atRule will be with @keyframes @import
 */
export class AtRule extends ParserNode<IAtRuleRaw> {
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
