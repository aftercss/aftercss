import { MessageCollection } from '@aftercss/shared';
import { Token, TokenReaderWithSourceMap } from '@aftercss/tokenizer';

// tslint:disable max-classes-per-file
export enum ParserNodeType {
  ANY = 'ANY',
  ATRULE = 'ATRULE',
  COMMENT = 'COMMENT',
  DECLARATION = 'DECLARATION',
  FUNCTION = 'FUNCTION',
  QUALIFIEDRULE = 'QUALIFIEDRULE',
  ROOT = 'ROOT',
}

export interface ISource {
  from: number;
  to: number;
}
export class ParserNode {
  public type: ParserNodeType;
  public childNodes: ParserNode[];
  public source: ISource;
  public constructor(type: ParserNodeType) {
    this.type = type;
    this.childNodes = [];
    this.source = {
      from: 0,
      to: 0,
    };
  }
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }

  public addChild(node: ParserNode) {
    this.childNodes.push(node);
  }
}

export class FunctionNode extends ParserNode {
  public name: string;
  public type: ParserNodeType;
  public value: Array<Token | ParserNode>;
  public constructor() {
    super(ParserNodeType.FUNCTION);
    this.name = '';
    this.value = [];
  }
}

export class CommentNode extends ParserNode {
  public content: string;
  public constructor(token: Token) {
    super(ParserNodeType.COMMENT);
    this.content = token.raw;
    this.source.from = token.start - token.raw.length;
    this.source.to = token.start;
  }
}

export class AtRule extends ParserNode {
  public name: string;
  public prelude: Array<FunctionNode | Token>;
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
  public value: Array<FunctionNode | Token>;
  public important: boolean;
  public constructor() {
    super(ParserNodeType.DECLARATION);
    this.important = false;
    this.value = [];
  }
}
