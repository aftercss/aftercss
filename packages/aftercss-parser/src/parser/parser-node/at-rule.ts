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
  fontface = 'font-face',
  keyframes = 'keyframes',
  counterstyle = 'counter-style',
  fontfeaturevalues = 'font-feature-values',
  viewport = 'viewport',
  msviewport = '-ms-viewport',
}

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

export interface INestedAtRuleRaw {
  beforeChildNodes: string[];
  besidesParams: string[];
}

export class NonNestedAtRule extends AtRule {
  public raw: INonNestedAtRuleRaw = {
    besidesValues: [],
  };
  public value: string[] = [];
  public constructor(props: EAtRuleName) {
    super(props);
  }
}

export class NestedAtRule extends AtRule {
  public childNodes: ParserNode[] = [];
  public params: string[] = [];
  public raw: INestedAtRuleRaw = {
    beforeChildNodes: [],
    besidesParams: [],
  };
  public constructor(props: EAtRuleName) {
    super(props);
  }
}
