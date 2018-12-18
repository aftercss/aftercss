// tslint:disable max-classes-per-file
import { EParserNodeType, ParserNode } from './node';
import { Rule } from './rule';

export enum EAtRuleName {
  charset = 'charset',
  import = 'import',
  namespace = 'namespace',
  media = 'media',
  supports = 'supports',
  page = 'page',
  'font-face' = 'font-face',
  keyframes = 'keyframes',
  'counter-style' = 'counter-style',
  'font-feature-values' = 'font-feature-values',
}

export interface IAtRuleRaw {
  afterName: string;
}

/**
 * atRule will be with @keyframes @import
 */
export class AtRule extends ParserNode {
  public name: EAtRuleName;
  public constructor(name: EAtRuleName) {
    super();
    this.name = name;
    this.type = EParserNodeType.AtRule;
  }
}

export interface INonNestedAtRuleRaw {
  besidesValues: string[];
}

export class CharsetAtRule extends AtRule {
  public raw: INonNestedAtRuleRaw = {
    besidesValues: [],
  };
  public value: string = undefined;
  public constructor() {
    super(EAtRuleName.charset);
  }
}
export class ImportAtRule extends AtRule {
  public raw: INonNestedAtRuleRaw = {
    besidesValues: [],
  };
  public value: string[] = []; // value[0] is url and value[1] is media-query
  public constructor() {
    super(EAtRuleName.import);
  }
}

export class NamespaceAtRule extends AtRule {
  public raw: INonNestedAtRuleRaw = {
    besidesValues: [],
  };
  public value: string[] = [];
  public constructor() {
    super(EAtRuleName.namespace);
  }
}

export class KeyframesAtRule extends AtRule {
  public children: Rule[] = [];
  constructor() {
    super(EAtRuleName.keyframes);
  }
}
