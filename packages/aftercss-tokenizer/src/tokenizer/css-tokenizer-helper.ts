import { BaseTokenizer } from './base-tokenizer';

export const helper = {
  consumeBadURL(tokenizer: BaseTokenizer) {
    let badurlContent = '';
    while (!tokenizer.isEof() && !tokenizer.eat(')')) {
      // consume a valid escape
      if (tokenizer.eat('\\') && tokenizer.pick() !== '\n') {
        badurlContent += this.consumeEscaped(tokenizer);
      } else {
        badurlContent += tokenizer.pick();
        tokenizer.step();
      }
    }
    return badurlContent;
  },
  consumeEscaped(tokenizer: BaseTokenizer) {
    // reverse solidus followed by a non-newline
    // https://www.w3.org/TR/css-syntax-3/#consume-an-escaped-code-point
    // assume that the U+005C REVERSE SOLIDUS (\) has already been consumed
    let escapedContent = '';
    if (!tokenizer.eat('\n')) {
      if (tokenizer.isEof()) {
        escapedContent = '\ufffd';
      }
      const hex = tokenizer.matchReg(/[0-9a-fA-F]{1,6}/);
      if (hex) {
        const hexToDec = parseInt(hex, 16);
        if (hexToDec === 0 || hexToDec >= 0x10ffff || (hexToDec >= 0xd800 && hexToDec <= 0xdfff)) {
          escapedContent += '\ufffd';
        } else {
          escapedContent += String.fromCodePoint(hexToDec); // a puzzle here
        }
        tokenizer.step(hex.length);
        tokenizer.eat(' ');
      } else {
        escapedContent += tokenizer.pick();
        tokenizer.step();
      }
    }
    return escapedContent;
  },
};
