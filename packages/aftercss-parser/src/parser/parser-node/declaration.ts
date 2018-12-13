import { EParserNodeType, ParserNode } from './node';

export interface IDeclarationRaw {
  beforeColon: string;
  afterColon: string;
}

export class Declaration extends ParserNode<IDeclarationRaw> {
  public prop: string;
  public value: string;
  public important: boolean;
  public type = EParserNodeType.Declaration;
  public constructor(prop: string, value: string) {
    super();
    this.prop = prop;
    this.value = value;
  }
}
