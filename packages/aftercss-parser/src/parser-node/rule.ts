import { EParserNodeType, ParserNode } from './node';

export interface IRuleRaw {
  beforeChildNodes: string[];
  beforeOpenBracket: string[];
}

export class Rule extends ParserNode {
  public selector: string[];
  public raw: IRuleRaw = {
    beforeChildNodes: [],
    beforeOpenBracket: [],
  };
  public constructor(selector: string[]) {
    super();
    this.selector = selector;
    this.childNodes = [];
    this.type = EParserNodeType.Rule;
  }

  public toString(): string {
    let str = '';
    // selector part
    let selectorIndex = 0;
    str += this.raw.beforeOpenBracket.reduce((acc, cur) => {
      if (cur === undefined) {
        return acc + this.selector[selectorIndex++];
      }
      return acc + cur;
    }, '');
    // bracket content
    str += '{';
    for (let i = 0; i < this.childNodes.length; i++) {
      str += this.raw.beforeChildNodes[i];
      str += this.childNodes[i].toString();
    }
    str += this.raw.beforeChildNodes[this.childNodes.length] + '}';
    return str;
  }
}
