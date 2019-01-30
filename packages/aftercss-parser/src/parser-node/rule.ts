import { EParserNodeType, ParserNode } from './node';

export interface IRuleRaw {
  beforeChildNodes: string[];
  beforeOpenBracket: string[];
}

export class Rule extends ParserNode {
  public childNodes: ParserNode[];
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
}
