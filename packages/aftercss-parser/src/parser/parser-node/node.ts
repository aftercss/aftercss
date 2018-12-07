import { MessageCollection } from '@aftercss/shared';
import { Token } from '@aftercss/tokenizer';

// tslint:disable max-classes-per-file
export enum ParserNodeType {
  ANY = 'ANY',
  ROOT = 'ROOT',
  BLOCK = 'BLOCK',
  ATRULE = 'ATRULE',
  DECLARATION = 'DECLARATION',
  FUNCTION = 'FUNCTION',
  QUALIFIEDRULE = 'QUALIFIEDRULE',
}
export class ParserNode {
  public type: ParserNodeType;
  public childNodes: Array<ParserNode | Token>;
  public constructor(type: ParserNodeType) {
    this.type = type;
    this.childNodes = [];
  }
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }

  public addChild(node: ParserNode | Token) {
    this.childNodes.push(node);
  }
}

export class Func extends ParserNode {
  public name: string;
  public constructor() {
    super(ParserNodeType.FUNCTION);
  }
}

export class Block extends ParserNode {
  public associatedToken: Token;
  public constructor() {
    super(ParserNodeType.BLOCK);
  }
}

export class AtRule extends ParserNode {
  public name: string;
  public block: Block;
  public prelude: Array<ParserNode | Token>;
  public constructor() {
    super(ParserNodeType.ATRULE);
  }
}

export class QualifiedRule extends ParserNode {
  public block: Block;
  public prelude: Array<ParserNode | Token>;
  public constructor() {
    super(ParserNodeType.QUALIFIEDRULE);
  }
}

export class Root extends ParserNode {
  public constructor() {
    super(ParserNodeType.ROOT);
  }
}

export class Declaration extends ParserNode {
  public name: string;
  public betweenNameValue: ParserNode;
  public value: Token[];
  public important: boolean;
  public constructor() {
    super(ParserNodeType.DECLARATION);
    this.important = false;
  }
}
