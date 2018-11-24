import { MessageCollection } from '@aftercss/shared';

// tslint:disable max-classes-per-file
export enum ParserNodeType {
  ANY = 'ANY',
  ROOT = 'ROOT',
  BLOCK = 'BLOCK',
  ATRULE = 'ATRULE',
  DECLARATION = 'DECLARATION',
}
export class ParserNode {
  public type: ParserNodeType;
  public childNodes: ParserNode[];
  public clone() {
    throw new Error(MessageCollection._THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_('ParserNode.clone', new Error().stack));
  }
}

export class Block extends ParserNode {
  public type = ParserNodeType.BLOCK;
}

export class AtRule extends ParserNode {
  public type = ParserNodeType.ATRULE;
  public block: Block;
}

export class Root extends ParserNode {
  public type = ParserNodeType.ROOT;
}

export class Declaration extends ParserNode {
  public type = ParserNodeType.DECLARATION;
  public name: ParserNode;
  public betweenNameValue: ParserNode;
  public value: ParserNode;
}
