// tslint:disable max-classes-per-file
import { EParserNodeType, ParserNode } from './node';

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
  viewport = 'viewport',
  '-ms-viewport' = '-ms-viewport',
}

export interface IAtRuleRaw {
  beforeChildNodes: string[];
  besidesParams: string[];
}

export class AtRule extends ParserNode {
  public childNodes: ParserNode[];
  public name: EAtRuleName;
  public isNested: boolean = false;
  public params: string[] = [];
  public raw: IAtRuleRaw = {
    beforeChildNodes: [],
    besidesParams: [],
  };
  public constructor(name: EAtRuleName) {
    super();
    this.name = name;
    this.type = EParserNodeType.AtRule;
  }
}
