import { EParserNodeType, ParserNode } from './node';

export interface IDeclarationRaw {
  afterColon: string[];
  beforeColon: string;
}

export class Declaration extends ParserNode {
  public prop: string;
  public value: string[];
  public important: boolean;
  public raw: IDeclarationRaw = {
    afterColon: [],
    beforeColon: '',
  };

  public constructor(prop: string, value: string[], important: boolean) {
    super();
    this.type = EParserNodeType.Declaration;
    this.important = important;
    this.prop = prop;
    this.value = value;
  }
}
