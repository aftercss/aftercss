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

export interface IJSONParserNode {
  type: EParserNodeType;
  start: number;
  childNodes?: ParserNode[];
  [prop: string]: any;
}

export class ParserNode {
  public type: EParserNodeType = EParserNodeType.ANY;
  public start: number;
  public parent: ParserNode = null;
  [prop: string]: any;
  public appendChildNode(nodes: ParserNode | ParserNode[]) {
    if (this.type === EParserNodeType.Comment || this.type === EParserNodeType.Declaration) {
      throw new Error(MessageCollection._INVALID_APPEND_CHILDNODE('Comment/Declatation'));
    }
    if (Array.isArray(nodes)) {
      this.childNodes.push(...nodes);
      nodes.forEach(node => {
        node.parent = this;
      });
    } else {
      this.childNodes.push(nodes);
      nodes.parent = this;
    }
  }
  /* istanbul ignore next */
  public checkType<T extends EParserNodeType>(type: T): this is ITypeMap[T] {
    return this.type === type;
  }
  public clone(): ParserNode {
    return this.cloneObject(this);
  }

  public insertAfter(nodes: ParserNode | ParserNode[]) {
    if (!this.parent) {
      throw new Error(MessageCollection._INVALID_PARENT_NODE('insert nodes after'));
    }
    const index = this.index();
    if (Array.isArray(nodes)) {
      this.parent.childNodes.splice(index, 1, this, ...nodes);
      nodes.forEach(node => {
        node.parent = this.parent;
      });
    } else {
      this.parent.childNodes.splice(index, 1, this, nodes);
      nodes.parent = this.parent;
    }
  }

  public insertBefore(nodes: ParserNode | ParserNode[]) {
    if (!this.parent) {
      throw new Error(MessageCollection._INVALID_PARENT_NODE('insert nodes before'));
    }
    const index = this.index();
    if (Array.isArray(nodes)) {
      this.parent.childNodes.splice(index, 0, ...nodes);
      nodes.forEach(node => {
        node.parent = this.parent;
      });
    } else {
      this.parent.childNodes.splice(index, 0, nodes);
      nodes.parent = this.parent;
    }
  }

  public remove(): ParserNode {
    if (this.parent) {
      const index = this.parent.childNodes.indexOf(this);
      this.parent.childNodes.splice(index, 1);
    }
    this.parent = null;
    return this;
  }

  public replaceWith(nodes: ParserNode | ParserNode[]) {
    if (!this.parent) {
      throw new Error(MessageCollection._INVALID_PARENT_NODE('replace'));
    }
    const index = this.index();
    if (Array.isArray(nodes)) {
      this.parent.childNodes.splice(index, 1, ...nodes);
      nodes.forEach(node => {
        node.parent = this.parent;
      });
    } else {
      this.parent.childNodes.splice(index, 1, nodes);
      nodes.parent = this.parent;
    }
  }
  public toJSON() {
    const res: IJSONParserNode = {
      start: 0,
      type: EParserNodeType.ANY,
    };
    for (const attr in this) {
      if (!this.hasOwnProperty(attr) || attr === 'parent') {
        continue;
      }
      const value = this[attr];
      if (Array.isArray(value)) {
        res[attr] = value.map((item: any) => {
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

  private cloneObject(source: any, parent?: ParserNode) {
    const cloned = Object.create(source);
    for (const attr in source) {
      /* istanbul ignore if */
      if (!source.hasOwnProperty(attr)) {
        continue;
      }
      let value = source[attr];
      if (attr === 'parent' && parent) {
        cloned[attr] = parent;
      } else if (Array.isArray(value)) {
        value = value.map((item: any) => {
          if (Array.isArray(item) || Object.prototype.toString.call(item) === '[object Object]') {
            /* istanbul ignore else */
            if (attr === 'childNodes') {
              // 当有子结点时，须设置子结点对应的父结点
              return this.cloneObject(item, cloned);
            } else {
              return this.cloneObject(item);
            }
          } else {
            return item;
          }
        });
      } else if (Object.prototype.toString.call(value) === '[object Object]') {
        value = this.cloneObject(value);
      }
      cloned[attr] = value;
    }
    return cloned;
  }

  private index(): number {
    if (!this.parent) {
      return -1;
    }
    return this.parent.childNodes.indexOf(this);
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
  public childNodes: ParserNode[];
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
