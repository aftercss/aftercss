// tslint:disable max-classes-per-file
class ParserRange {
  public readonly start: number;
  public readonly end: number;
  public constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }
}
class ParserNode {
  public readonly range: ParserRange;
  public readonly start: number;
  public readonly end: number;
  public readonly value: string;

  public toValue(s: string) {
    return s;
  }
}
