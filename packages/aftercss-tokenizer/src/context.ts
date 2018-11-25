import { AfterContext } from '@aftercss/shared';
/** not elegent */
let globalContext: AfterContext = null;
export function setContext(c: AfterContext) {
  globalContext = c;
}
export function getContext() {
  return globalContext;
}
