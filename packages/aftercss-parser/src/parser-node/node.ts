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
  public parent: ParserNode = null;
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }
  public checkType<T extends EParserNodeType>(type: T): this is ITypeMap[T] {
    return this.type === type;
  }
  public toJSON() {
    const res: {
      type: EParserNodeType;
      start: number;
      childNodes: ParserNode[];
      [prop: string]: any;
    } = {
      childNodes: [],
      start: 0,
      type: EParserNodeType.ANY,
    };
    for (const attr in this) {
      if (!this.hasOwnProperty(attr) || attr === 'parent') {
        continue;
      }
      const value = this[attr];
      if (Array.isArray(value)) {
        res[attr] = value.map(item => {
          if (Object.prototype.toString.call(item) === '[object Object]' && item.toJSON) {
            return item.toJSON();
          } else {
            return item;
          }
        });
      } else {
        res[attr] = value;
      }
    }
    return res;
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
    this.start = 0;
  }
}
