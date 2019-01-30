export interface IContextOption {
  fileContent: string;
}

/**
 * Process Context
 */
export class AfterContext {
  public fileContent: string;
  public constructor(option: IContextOption) {
    /* istanbul ignore if */
    if (!option) {
      throw Error('require file content to process');
    }
    this.fileContent = option.fileContent;
  }
}
