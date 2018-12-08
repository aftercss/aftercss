import { MessageCollection } from '@aftercss/shared';
import { Token } from '@aftercss/tokenizer';

// tslint:disable max-classes-per-file
export enum ParserNodeType {
  ANY = 'ANY',
  BAD_DECLARATION = 'BAD_DECLARATION',
  ROOT = 'ROOT',
  ATRULE = 'ATRULE',
  COMMENT = 'COMMENT',
  DECLARATION = 'DECLARATION',
  FUNCTION = 'FUNCTION',
  QUALIFIEDRULE = 'QUALIFIEDRULE',
}

export interface ISource {
  raw: string;
}
export class ParserNode {
  public type: ParserNodeType;
  public childNodes: ParserNode[];
  public source: ISource;
  public constructor(type: ParserNodeType) {
    this.type = type;
    this.childNodes = [];
    this.source = {
      raw: '',
    };
  }
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }

  public addChild(node: ParserNode) {
    this.childNodes.push(node);
  }
}

export class FunctionNode {
  public name: string;
  public type: ParserNodeType;
  public value: Token[];
  public constructor() {
    this.type = ParserNodeType.FUNCTION;
  }
}

export class CommentNode extends ParserNode {
  public content: string;
  public constructor(content: string) {
    super(ParserNodeType.COMMENT);
    this.content = content;
  }
}

export class AtRule extends ParserNode {
  public name: string;
  public prelude: Array<ParserNode | Token>;
  public constructor() {
    super(ParserNodeType.ATRULE);
  }
}

export class QualifiedRule extends ParserNode {
  public prelude: Token[];
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
  public value: Token[];
  public important: boolean;
  public constructor() {
    super(ParserNodeType.DECLARATION);
    this.important = false;
    this.value = [];
  }
}

export class BadDeclaration extends ParserNode {
  public content: string;
  public constructor() {
    super(ParserNodeType.BAD_DECLARATION);
  }
}
