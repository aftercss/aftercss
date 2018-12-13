// tslint:disable max-classes-per-file
import { MessageCollection } from '@aftercss/shared';

export enum EParserNodeType {
  AtRule = 'AtRule',
  Comment = 'COMMENT',
  Declaration = 'DECLARATION',
  Root = 'ROOT',
  Rule = 'RULE',
}

export class ParserNode<T> {
  public raws: T;
  public type: EParserNodeType;
  public start: number;
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }
}

export enum kDeclarationRawName {
  beforeColon = 'beforeColon',
  afterColon = 'afterColon',
}

export class Declaration extends ParserNode<Map<kDeclarationRawName, string>> {
  public type = EParserNodeType.Declaration;
  public important: boolean;
  public prop: string;
  public value: string;
  public constructor(prop: string, value: string) {
    super();
    this.prop = prop;
    this.value = value;
  }
}

export class CommentNode extends ParserNode<void> {
  public content: string;
  public constructor(content: string) {
    super();
    this.content = content;
  }
}

export class Root extends ParserNode<void> {
  public type = EParserNodeType.Root;
}
