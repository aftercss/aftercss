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

  public toString(): string {
    let str = '';
    // name
    str += `@${this.name}`;
    // params content
    let paramIndex = 0;
    str += this.raw.besidesParams.reduce((acc, cur) => {
      if (cur === undefined) {
        return acc + this.params[paramIndex++];
      }
      return acc + cur;
    }, '');
    // childNodes
    if (this.isNested) {
      str += '{';
      for (let i = 0; i < this.childNodes.length; i++) {
        str += this.raw.beforeChildNodes[i];
        str += this.childNodes[i].toString();
      }
      str += this.raw.beforeChildNodes[this.childNodes.length] + '}';
    }
    return str;
  }
}
