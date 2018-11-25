import { getLocator, Location } from 'locate-character';
export interface IContextOption {
  sourceMap?: boolean;
  fileContent: string;
  fileName?: string;
}

declare interface ILocator {
  (search: string, startIndex?: number): Location;
  (search: number): Location;
}
/**
 * Process Context
 */
export class AfterContext {
  public sourceMap: boolean;
  public fileName: string;
  public fileContent: string;
  public locater: ILocator;
  public constructor(option: IContextOption) {
    if (!option) {
      throw Error('require file content to process');
    }
    this.sourceMap = option.sourceMap === true;
    this.fileName = option.fileName || '';
    this.fileContent = option.fileContent;
    if (this.sourceMap) {
      this.locater = getLocator(this.fileContent) as ILocator;
    }
  }
  /**
   * ⚠️ Alert: if no sourceMap required, this will return null
   * @param index
   */
  public getLocation(index: number): Location {
    return this.locater(index);
  }
}
