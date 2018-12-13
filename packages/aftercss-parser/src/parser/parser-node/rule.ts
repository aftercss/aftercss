import { EParserNodeType, ParserNode } from './node';

export interface IRuleRaws {
  afterSelector: string;
  beforeDecls: string[];
}

export class Rule extends ParserNode<IRuleRaws> {
  public type = EParserNodeType.Rule;
}
