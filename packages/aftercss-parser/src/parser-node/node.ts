// tslint:disable max-classes-per-file
import { MessageCollection } from '@aftercss/shared';

export enum EParserNodeType {
  AtRule = 'ATRULE',
  Comment = 'COMMENT',
  Declaration = 'DECLARATION',
  Root = 'ROOT',
  Rule = 'RULE',
}

export class ParserNode {
  public type: EParserNodeType;
  public start: number;
  public childNodes: ParserNode[];
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }
}

export interface IRootRaw {
  beforeChildNodes: string[];
}

export class Comment extends ParserNode {
  public content: string;
  public constructor(content: string) {
    super();
    this.content = content;
    this.type = EParserNodeType.Comment;
  }
}

export class Root extends ParserNode {
  public raw: IRootRaw = {
    beforeChildNodes: [],
  };
  public constructor() {
    super();
    this.childNodes = [];
    this.type = EParserNodeType.Root;
  }
}
