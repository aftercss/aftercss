import { INumberProp } from '../token';
import { BaseTokenizer } from './base-tokenizer';

export const helper = {
  /*  consume the remnants of a badurl
  	*  https://www.w3.org/TR/css-syntax-3/#consume-the-remnants-of-a-bad-url
  	*/
  consumeBadURL(tokenizer: BaseTokenizer) {
    let badurlContent = '';
    while (!tokenizer.isEof() && !tokenizer.eat(')')) {
      // consume a valid escape
      if (this.isValidEscape(tokenizer)) {
        tokenizer.step(); // consume '\\'
        badurlContent += this.consumeEscaped(tokenizer);
      } else {
        badurlContent += tokenizer.pick();
        tokenizer.step();
      }
    }
    return badurlContent;
  },

  /**
   * reverse solidus followed by a non-newline
   * https://www.w3.org/TR/css-syntax-3/#consume-an-escaped-code-point
   * assume that the U+005C REVERSE SOLIDUS (\) has already been consumed
   */
  consumeEscaped(tokenizer: BaseTokenizer) {
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
      const currentChar = tokenizer.pick();
      if (currentChar === ' ' || currentChar === '\t' || currentChar === '\n') {
        tokenizer.step();
      }
    } else {
      escapedContent += tokenizer.pick();
      tokenizer.step();
    }
    return escapedContent;
  },

  /**
   * consume a name
   * https://www.w3.org/TR/css-syntax-3/#consume-a-name
   */
  consumeName(tokenizer: BaseTokenizer) {
    let nameContent = '';
    while (1) {
      const currentChar = tokenizer.pick();
      // name code point
      if (this.isNameStarter(tokenizer) || /[0-9\-]/.test(currentChar)) {
        nameContent += currentChar;
        tokenizer.step();
        continue;
      }
      if (this.isValidEscape(tokenizer)) {
        tokenizer.step(); // consume '\\'
        nameContent += this.consumeEscaped(tokenizer);
        continue;
      }
      return nameContent;
    }
  },

  /**
   * consume a number
   * https://www.w3.org/TR/css-syntax-3/#consume-a-number
   * Ensure that the stream starts with a number before calling this function
   */
  consumeNumber(tokenizer: BaseTokenizer) {
    const numberContent: INumberProp = {
      repr: '',
      type: 'integer',
      value: 0,
    };
    const digitReg = /[0-9]/;
    const nonDigitReg = /[^0-9]/;
    if (tokenizer.pick() === '+' || tokenizer.pick() === '-') {
      numberContent.repr += tokenizer.pick();
      tokenizer.step();
    }
    numberContent.repr += tokenizer.readUntil(nonDigitReg);
    if (tokenizer.pick() === '.' && digitReg.test(tokenizer.pick(1))) {
      numberContent.repr += `.${tokenizer.pick(1)}`;
      numberContent.type = 'number';
      tokenizer.step(2);
      if (!tokenizer.isEof()) {
        numberContent.repr += tokenizer.readUntil(nonDigitReg);
      }
    }
    if (
      (tokenizer.pick() === 'e' || tokenizer.pick() === 'E') &&
      (digitReg.test(tokenizer.pick(1)) ||
        ((tokenizer.pick(1) === '+' || tokenizer.pick(1) === '-') && digitReg.test(tokenizer.pick(2))))
    ) {
      numberContent.repr += `e${tokenizer.pick(1)}`;
      numberContent.type = 'number';
      tokenizer.step(2);
      if (!tokenizer.isEof()) {
        numberContent.repr += tokenizer.readUntil(nonDigitReg);
      }
    }

    numberContent.value = +numberContent.repr;
    return numberContent;
  },
  /**
   * check if three code points would start an indentifier
   * https://www.w3.org/TR/css-syntax-3/#would-start-an-identifier
   */
  isIdentifierStarter(tokenizer: BaseTokenizer, cnt: number = 0) {
    if (
      (tokenizer.pick(cnt) === '-' &&
        (this.isNameStarter(tokenizer, cnt + 1) || this.isValidEscape(tokenizer, cnt + 1))) ||
      this.isNameStarter(tokenizer, cnt) ||
      this.isValidEscape(tokenizer, cnt)
    ) {
      return true;
    }
    return false;
  },
  isNumberStarter(tokenizer: BaseTokenizer, cnt: number = 0) {
    const firstCodePoint = tokenizer.pick(cnt);
    const secondCodePoint = tokenizer.pick(cnt + 1);
    const thirdCodePoint = tokenizer.pick(cnt + 2);
    const numberReg = /[0-9]/;
    if (
      ((firstCodePoint === '+' || firstCodePoint === '-') &&
        (numberReg.test(secondCodePoint) || (secondCodePoint === '.' && numberReg.test(thirdCodePoint)))) ||
      ((firstCodePoint === '.' && numberReg.test(secondCodePoint)) || numberReg.test(firstCodePoint))
    ) {
      return true;
    }
    return false;
  },
  isNameStarter(tokenizer: BaseTokenizer, cnt: number = 0) {
    const codePoint = tokenizer.pick(cnt);
    return /[a-zA-Z\_]/.test(codePoint) || codePoint >= '\u0080';
  },
  isValidEscape(tokenizer: BaseTokenizer, cnt: number = 0) {
    return tokenizer.pick(cnt) === '\\' && tokenizer.pick(cnt + 1) !== '\n';
  },
};
