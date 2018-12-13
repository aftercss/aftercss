import { EParserNodeType, ParserNode } from './node';

export enum kDeclarationRawName {
  beforeColon = 'beforeColon',
  afterColon = 'afterColon',
}

export type DeclarationRaw = Map<kDeclarationRawName, string>;

export class Declaration extends ParserNode<DeclarationRaw> {
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
