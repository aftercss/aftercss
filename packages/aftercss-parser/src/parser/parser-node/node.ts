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

export class Root extends ParserNode {
  public constructor() {
    super(ParserNodeType.ROOT);
  }
}

export class Declaration extends ParserNode {
  public name: ParserNode;
  public betweenNameValue: ParserNode;
  public value: ParserNode;
  public constructor() {
    super(ParserNodeType.DECLARATION);
  }
}
