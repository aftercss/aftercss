import { BaseParser } from '../base';
/**
 * 正整数
 * @param parser
 */
export function $positiveInteger(parser: BaseParser): string | false {
  const res = parser.matchReg(/[\d]+/i);
  if (!res) {
    return false;
  } else {
    return res;
  }
}
/**
 * 正整数
 * @param parser
 */
export function $negativeInteger(parser: BaseParser): string | false {
  const res = parser.matchReg(/\-[\d+]/i);
  if (!res) {
    return false;
  } else {
    return res;
  }
}

/**
 * 正数 (整数或者小数)
 * @param parser
 */
export function $positiveDecimal(parser: BaseParser): string | false {
  const res = parser.matchReg(/^[0-9]*[.][0-9]+/);
  if (!res) {
    return false;
  } else {
    return res;
  }
}
/**
 * 负数
 * @param parser
 */
export function $negativeDecimal(parser: BaseParser): string | false {
  const res = parser.matchReg(/^\-[0-9]*[.][0-9]+/);
  if (!res) {
    return false;
  } else {
    return res;
  }
}
/**
 * 数字 +/-
 * 支持小数点
 */
export function $decimal(parser: BaseParser): string | false {
  return $positiveDecimal(parser) || $negativeDecimal(parser);
}
/**
 * 正负整数
 * @param parser
 */
export function $integer(parser: BaseParser): string | false {
  return $positiveInteger(parser) || $negativeInteger(parser);
}
export function $number(parser: BaseParser): string | false {
  return $decimal(parser) || $integer(parser);
}
/**
 * 可选空白
 * @param parser
 */
export function $whiteSpace(parser: BaseParser): string | false {
  const s = parser.matchReg(/[\s\t\n]*/);
  if (!s) {
    return '';
  }
  return s;
}
/**
 * 至少一个空白
 * @param parser
 */
export function $requireSpace(parser: BaseParser): string | false {
  const ws = parser.matchReg(/[\s\t\n]*/);
  if (ws === '') {
    return false;
  }
  return ws;
}
export function $notBackBrace(parser: BaseParser): string | false {
  const str = parser.matchReg(/[^)]*/i);
  if (str === '') {
    return false;
  }
  return str;
}
