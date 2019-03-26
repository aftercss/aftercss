import { BaseParser } from '../../base';

export class AtomicPlugin {
  public name: string = '';
  public parse(parser: BaseParser) {
    throw new Error(`parse function should be implemented in ${this.name}`);
  }
  public distance(parser: BaseParser) {
    throw new Error(`distance function should be implemented in ${this.name}`);
  }
  public example() {
    return '';
  }
}
