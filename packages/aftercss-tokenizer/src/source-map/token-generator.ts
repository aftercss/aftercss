import { AfterContext, MessageCollection } from '@aftercss/shared';
import { SourceNode } from 'source-map';
import { TokenReader } from '../stream-token/token-reader';
import { Token } from '../token';
import { CSSTokenizer } from '../tokenizer/css-tokenizer';

export class TokenReaderWithSourceMap extends TokenReader {
  public context: AfterContext;

  public constructor(tokenizer: CSSTokenizer);
  public constructor(tokens: Token[], context: AfterContext);
  public constructor(tokensOrTokenizer: Token[] | CSSTokenizer, context?: AfterContext) {
    super(tokensOrTokenizer);
    if (Object.prototype.toString.call(tokensOrTokenizer) === '[object Array]') {
      if (context instanceof AfterContext) {
        this.context = context;
      } else {
        throw new Error(MessageCollection._WHEN_USING_TOKENS_SHOULD_PASS_CONTEXT_(context));
      }
    } else {
      const tokenizer = tokensOrTokenizer as CSSTokenizer;
      this.context = tokenizer.context;
    }
  }

  public generateSourceMap(tokens: Token[]) {
    const sourceNodes = tokens.map(token => {
      const { line, column } = this.context.getLocation(token.start);
      const sourceNode = new SourceNode(line, column, this.context.fileName, token.raw);
      return sourceNode;
    });
    return new SourceNode(1, 0, this.context.fileName, sourceNodes)
      .toStringWithSourceMap({
        file: this.context.fileName,
      })
      .map.toString();
  }
}
