// tslint:disable max-classes-per-file
import { MessageCollection } from '@aftercss/shared';
import { AtRule } from './at-rule';
import { Declaration } from './declaration';
import { Rule } from './rule';

export enum EParserNodeType {
  AtRule = 'ATRULE',
  Comment = 'COMMENT',
  Declaration = 'DECLARATION',
  Root = 'ROOT',
  Rule = 'RULE',
  ANY = 'ANY',
}

export interface ITypeMap {
  ATRULE: AtRule;
  COMMENT: Comment;
  DECLARATION: Declaration;
  ROOT: Root;
  RULE: Rule;
  [prop: string]: ParserNode;
}

export class ParserNode {
  public type: EParserNodeType = EParserNodeType.ANY;
  public start: number;
  public childNodes: ParserNode[];
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }
  public checkType<T extends EParserNodeType>(type: T): this is ITypeMap[T] {
    return this.type === type;
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
