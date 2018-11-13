import { BaseTokenizer } from './base-tokenizer';

export const helper = {
  consumeBadURL(tokenizer: BaseTokenizer) {
    /* consume the remnants of a badurl
     * https://www.w3.org/TR/css-syntax-3/#consume-the-remnants-of-a-bad-url
     */
    let badurlContent = '';
    while (!tokenizer.isEof() && !tokenizer.eat(')')) {
      // consume a valid escape
      if (this.isValidEscape(tokenizer.pick(), tokenizer.pick(1))) {
        tokenizer.step(); // consume '\\'
        badurlContent += this.consumeEscaped(tokenizer);
      } else {
        badurlContent += tokenizer.pick();
        tokenizer.step();
      }
    }
    return badurlContent;
  },
  consumeEscaped(tokenizer: BaseTokenizer) {
    /* reverse solidus followed by a non-newline
     * https://www.w3.org/TR/css-syntax-3/#consume-an-escaped-code-point
     * assume that the U+005C REVERSE SOLIDUS (\) has already been consumed
		 */
    let escapedContent = '';
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
    return escapedContent;
  },
  consumeName(tokenizer: BaseTokenizer) {
    /* consume a name 
		 * https://www.w3.org/TR/css-syntax-3/#consume-a-name
		 */
    let nameContent = '';
    while (1) {
      const currentChar = tokenizer.pick();
      // name code point
      if (this.isNameStart(currentChar) || /[0-9\-]/.test(currentChar)) {
        nameContent += currentChar;
        tokenizer.step();
        continue;
      }
      if (this.isValidEscape(currentChar, tokenizer.pick(1))) {
        tokenizer.step(); // consume '\\'
        nameContent += this.consumeEscaped(tokenizer);
        continue;
      }
      return nameContent;
    }
  },
  consumeNumber(tokenizer: BaseTokenizer) {
    /**
     * consume a number
     * https://www.w3.org/TR/css-syntax-3/#consume-a-number
     * Ensure that the stream starts with a number before calling this function
     */
    const numberContent = {
      repr: '',
      type: 'integer',
      value: 0,
    };
    const numberReg = /[0-9]/;
    if (tokenizer.pick() === '+' || tokenizer.pick() === '-') {
      numberContent.repr += tokenizer.pick();
      tokenizer.step();
    }
    addContinusNumber();
    if (tokenizer.eat('.') && numberReg.test(tokenizer.pick())) {
      numberContent.repr += `.${tokenizer.pick()}`;
      numberContent.type = 'number';
      tokenizer.step();
      addContinusNumber();
    }
    if (
      (tokenizer.eat('e') || this.eat('E')) &&
      (numberReg.test(tokenizer.pick()) ||
        ((tokenizer.pick() === '+' || tokenizer.pick() === '-') && numberReg.test(tokenizer.pick(1))))
    ) {
      numberContent.repr += `e${this.pick()}`;
      numberContent.type = 'number';
      addContinusNumber();
    }

    numberContent.value = parseInt(numberContent.repr, 10);
    return numberContent;

    function addContinusNumber() {
      while (numberReg.test(tokenizer.pick())) {
        numberContent.repr += tokenizer.pick();
        tokenizer.step();
      }
    }
  },
  isNameStart(codePoint: string) {
    return /[a-zA-Z\_]/.test(codePoint) || codePoint >= '\u0080';
  },
  isValidEscape(firstCodePoint: string, secondCodePoint: string) {
    return firstCodePoint === '\\' && secondCodePoint !== '\n';
  },
};
