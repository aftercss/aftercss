const UNICODERANGE = /u\+[?]{1,6}|u\+[0-9a-f]{1}[?]{0,5}|u\+[0-9a-f]{2}[?]{0,4}|u\+[0-9a-f]{3}[?]{0,3}|u\+[0-9a-f]{4}[?{0,2}|u\+[0-9a-f]{5}[?]{0,1}|u\+[0-9a-f]{6}|u\+[0-9a-f]{1,6}-[0-9a-f]{1,6}/;

const CDO = /\<\!\-\-/;
const CDC = /\-\-\>/;
const colon = /:/;  
const leftBigBrace = /\{/;
const rightBigBrace = /\}/;
const leftLittleBrace = /\(/;
const rightLittleBrace = /\)/;
const leftMiddleBrace = /\[/;
const rightMiddleBrace = /\]/;
const S = /[ \t\r\n\f]+/; 
const COMMENT =	/\/\*[^*]*\*+([^/*][^*]*\*+)*\//;
const num =	/[+-]?([0-9]+|[0-9]*\.[0-9]+)(e[+-]?[0-9]+)?/;
const writeSpace = /[ \t\r\n\f]*/;