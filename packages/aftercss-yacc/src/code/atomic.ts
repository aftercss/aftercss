import { BaseParser } from '../base';

export const AtomicFunction: Record<string, (parser: BaseParser) => string | false> = {
  /**
   * 正整数
   * @param parser
   */
  $positiveInteger(parser: BaseParser): string | false {
    const res = parser.matchReg(/[\d]+/i);
    if (!res) {
      return false;
    } else {
      return res;
    }
  },
  /**
   * 正整数
   * @param parser
   */
  $negativeInteger(parser: BaseParser): string | false {
    const res = parser.matchReg(/\-[\d+]/i);
    if (!res) {
      return false;
    } else {
      return res;
    }
  },
  /**
   * 正数 (整数或者小数)
   * @param parser
   */
  $positiveDecimal(parser: BaseParser): string | false {
    const res = parser.matchReg(/^[0-9]*[.][0-9]+/);
    if (!res) {
      return false;
    } else {
      return res;
    }
  },
  /**
   * 负数
   * @param parser
   */
  $negativeDecimal(parser: BaseParser): string | false {
    const res = parser.matchReg(/^\-[0-9]*[.][0-9]+/);
    if (!res) {
      return false;
    } else {
      return res;
    }
  },
  /**
   * 数字 +/-
   * 支持小数点
   */
  $decimal(parser: BaseParser): string | false {
    return AtomicFunction.$positiveDecimal(parser) || AtomicFunction.$negativeDecimal(parser);
  },
  /**
   * 正负整数
   * @param parser
   */
  $integer(parser: BaseParser): string | false {
    return AtomicFunction.$positiveInteger(parser) || AtomicFunction.$negativeInteger(parser);
  },
  $number(parser: BaseParser): string | false {
    return AtomicFunction.$decimal(parser) || AtomicFunction.$integer(parser);
  },
  /**
   * 可选空白
   * @param parser
   */
  $whiteSpace(parser: BaseParser): string | false {
    const s = parser.matchReg(/[\s\t\n]*/);
    if (!s) {
      return '';
    }
    return s;
  },
  /**
   * 至少一个空白
   * @param parser
   */
  $requireSpace(parser: BaseParser): string | false {
    const ws = parser.matchReg(/[\s\t\n]*/);
    if (ws === '') {
      return false;
    }
    return ws;
  },
  $notBackBrace(parser: BaseParser): string | false {
    const str = parser.matchReg(/[^)]*/i);
    if (str === '') {
      return false;
    }
    return str;
  },
};
