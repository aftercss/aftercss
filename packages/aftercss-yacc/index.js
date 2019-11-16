// this file is for debugger;
const RuleParser = require('./lib/rule/rule-parser').RuleParser;

// margin ===> ( $number'px' / $number''

// distance-unit ===> ( 'px' / '%' / 'rpx' / 'rem' ) // 要不要 rem 呢？ 要根据 rule 来判断的
// rgba ===> $function(url, $str()) 

// %background-color [$requireWhiteSpace %background-repeat]
// $number 'px'
// { %margin-top & %margin-bottom & %margin-top & %margin-right }
//  ('0' / %d'px' / %d'%' / %d'rpx' / %d'vh' / 'env(safe-area)' )
const parser = new RuleParser('%background-image $requireSpace %background-repeat');
parser.parse();
console.log(JSON.stringify(parser.rootRule, null, 2));

const parser1 = new RuleParser("'url(' $notBackBrace ')'");
parser1.parse();
console.log(JSON.stringify(parser1.rootRule, null, 2));

const parser2 = new RuleParser("('no-repeat')");
parser2.parse();
console.log(JSON.stringify(parser2.rootRule, null, 2));

const CodeParser = require('./lib/code/code-parser').CodeParser;
const codeParser = new CodeParser('a', "url('asdfads') no-repeat", {
  a: parser.rootRule,
  'background-image': parser1.rootRule,
  'background-repeat': parser2.rootRule,
});
const res = codeParser.parse();
console.log(JSON.stringify(res, null, 2));
// const parser2 = new Parser("%dpr 'px' [%wsr %background-repeat]");
// parser2.parse();
// console.log(JSON.stringify(parser2.rootRule, null,2));
