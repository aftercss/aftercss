import { AfterContext, MessageCollection } from '@aftercss/shared';
import { getLocator, Location } from 'locate-character';
import { SourceNode } from 'source-map';
import { TokenReader } from '../stream-token/token-reader';
import { Token } from '../token';
import { CSSTokenizer } from '../tokenizer/css-tokenizer';
declare interface ILocator {
  (search: string, startIndex?: number): Location;
  (search: number): Location;
}
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
  /**
   * @param index
   */
  public getLocation(index: number): Location {
    return (getLocator(this.context.fileContent) as ILocator)(index);
  }

  public generateSourceMap(tokens: Token[], fileName: string) {
    const sourceNodes = tokens.map(token => {
      const { line, column } = this.getLocation(token.start);
      const sourceNode = new SourceNode(line, column, fileName, token.raw);
      return sourceNode;
    });
    return new SourceNode(1, 0, fileName, sourceNodes)
      .toStringWithSourceMap({
        file: fileName,
      })
      .map.toString();
  }
}
