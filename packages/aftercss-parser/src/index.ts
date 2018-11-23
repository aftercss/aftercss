import { Token } from '@aftercss/tokenizer';
export class Parser {
  public tokens: Token[];
  public constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
}
