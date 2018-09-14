class ParserRange {
  readonly start: number;
  readonly end: number;
  public constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}
class ParserNode {
  readonly range: ParserRange;
  readonly value: string;
  public toValue(s: string) {}
}
