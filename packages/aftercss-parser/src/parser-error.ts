class CSSSyntaxError extends Error {
  public index: number;
  public constructor(index: number, message: string) {
    super(message);
    this.index = index;
  }
}
