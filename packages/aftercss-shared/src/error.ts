export function format(template: string, args: Array<string | number>) {
  return template.replace(/{(\d+)}/g, (i0, i1) => {
    const index = +i1;
    return `${args[index]}`;
  });
}

export enum ArgNumber {
  ZERO,
  ONE,
  TWO,
  THREE,
}

export interface IErrorFunction {
  0: () => string;
  1: (i0: string | number) => string;
  2: (i0: string | number, i1: string | number) => string;
  3: (i0: string | number, i1: string | number, i2: string | number) => string;
  [key: number]: (...args: Array<string | number>) => string;
}

function messageBuilder<T extends ArgNumber>(template: string): IErrorFunction[T] {
  return (...args: Array<string | number>) => {
    return format(template, args);
  };
}

export namespace MessageCollection {
  export const _SHOULD_NOT_BE_COLON_ = messageBuilder<ArgNumber.ZERO>('Should not be < colon-token : `:` >');
  export const _THIS_FUNCTION_SHOULD_BE_IN_SUBCLASS_ = messageBuilder<ArgNumber.TWO>(
    '{0} function should be in sub class, stack:\r\n {1}',
  );
  export const _READER_INIT_WRONG_ = messageBuilder<ArgNumber.ZERO>(
    'Stream reader should get a token list or a tokenizer. But got nothing',
  );
  export const _WHEN_USING_TOKENS_SHOULD_PASS_CONTEXT_ = messageBuilder<ArgNumber.ONE>(
    'When generating source map for tokens( ArrayType ), should pass Context in second param.\n But get {0}',
  );
  export const _TOKEN_READER_NOT_GETTING_RIGHT_PARAM_ = messageBuilder<ArgNumber.ONE>(
    'TokenSourceMap is not getting right params. {0}',
  );
  export const _INVALID_DECLARATION_ = messageBuilder<ArgNumber.ONE>('Invalid Declaration, {0}');
  export const _UNEXPECTED_RIGHT_CURLY_BRACKET_ = messageBuilder<ArgNumber.ZERO>('Unexpected }');
  export const _UNCLOSED_BLOCK_ = messageBuilder<ArgNumber.ONE>('Encounter unclosed block {0}');
  export const _INVALID_CHARSET_AT_RULE_ = messageBuilder<ArgNumber.ONE>('Invalid @charset rule: {0}');
  export const _ABSTRACT_CLASS_ = messageBuilder<ArgNumber.ONE>('Class {0} is an abstract class');
  export const _UNEXPECTED_AT_RULE_ = messageBuilder<ArgNumber.ONE>('Unexpected at rule {0}');
  export const _INVALID_APPEND_CHILDNODE = messageBuilder<ArgNumber.ONE>("Cann't append a childNode to {0} node");
  export const _INVALID_PARENT_NODE = messageBuilder<ArgNumber.ONE>("Cann't {0} a node whose parent node is null");
}
