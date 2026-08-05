import {createHash} from 'node:crypto';

export class CharacterGenomeSyntaxError extends Error{
  constructor(code,message,token){super(message);this.name='CharacterGenomeSyntaxError';this.code=code;this.location=token?{line:token.line,column:token.column,offset:token.start,end:token.end}:null}
}

const isStart=char=>Boolean(char)&&/[\p{L}_]/u.test(char);
const isPart=char=>Boolean(char)&&/[\p{L}\p{N}_-]/u.test(char);

export function lexCharacterGenome(source){
  const tokens=[];let index=0,line=1,column=1;
  const advance=()=>{const char=source[index++];if(char==='\n'){line++;column=1}else column++;return char};
  const push=(type,value,startLine,startColumn,start)=>tokens.push({type,value,line:startLine,column:startColumn,start,end:index});
  while(index<source.length){
    const char=source[index];if(/\s/u.test(char)){advance();continue}if(char==='/'&&source[index+1]==='/'){while(index<source.length&&advance()!=='\n');continue}
    const start=index,startLine=line,startColumn=column;
    if(char==='"'||char==="'"){const quote=advance();let value='',closed=false;while(index<source.length){const next=advance();if(next===quote){closed=true;break}if(next==='\\'&&index<source.length){const escaped=advance();value+=escaped==='n'?'\n':escaped}else value+=next}if(!closed)throw new CharacterGenomeSyntaxError('CHARACTER_STRING_UNTERMINATED','Unterminated string',tokens.at(-1)??{line:startLine,column:startColumn,start,end:index});push('string',value,startLine,startColumn,start);continue}
    if(/[0-9-]/u.test(char)){let raw=advance();while(index<source.length&&/[0-9.]/u.test(source[index]))raw+=advance();if(!Number.isFinite(Number(raw)))throw new CharacterGenomeSyntaxError('CHARACTER_NUMBER_INVALID',`Invalid number '${raw}'`,{line:startLine,column:startColumn,start,end:index});push('number',raw,startLine,startColumn,start);continue}
    if(isStart(char)){let raw=advance();while(index<source.length&&isPart(source[index]))raw+=advance();push('id',raw,startLine,startColumn,start);continue}
    if('{}:.;'.includes(char)){advance();push('symbol',char,startLine,startColumn,start);continue}
    throw new CharacterGenomeSyntaxError('CHARACTER_TOKEN_UNEXPECTED',`Unexpected character '${char}'`,{line:startLine,column:startColumn,start,end:start+1});
  }
  tokens.push({type:'eof',value:'<eof>',line,column,start:index,end:index});return tokens;
}

class Parser{
  constructor(source){this.source=source;this.tokens=lexCharacterGenome(source);this.index=0;this.sourceMap={}}
  current(){return this.tokens[this.index]}
  at(value){return this.current().value===value}
  advance(){const token=this.current();if(token.type!=='eof')this.index++;return token}
  expect(value,message=`Expected '${value}'`){if(!this.at(value))throw new CharacterGenomeSyntaxError('CHARACTER_SYNTAX',message,this.current());return this.advance()}
  expectId(message='Expected identifier'){if(this.current().type!=='id')throw new CharacterGenomeSyntaxError('CHARACTER_SYNTAX',message,this.current());return this.advance()}
  optionalSemi(){while(this.at(';'))this.advance()}
  value(){if(this.current().type==='number')return Number(this.advance().value);if(this.current().type==='string')return this.advance().value;let value=this.expectId().value;while(this.at(':')||this.at('.')){value+=this.advance().value;value+=this.expectId('Expected identifier after separator').value}return value}
  mark(path,start,end=this.tokens[this.index-1]){this.sourceMap[path]={kind:'CharacterGenomeField',line:start.line,column:start.column,end_line:end.line,end_column:end.column,offset:start.start,end_offset:end.end}}
  fields(blockName){const result={};this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('}'))break;const key=this.expectId(`Expected ${blockName} field`),value=this.value();if(Object.hasOwn(result,key.value))throw new CharacterGenomeSyntaxError('CHARACTER_FIELD_DUPLICATE',`Duplicate ${blockName}.${key.value}`,key);result[key.value]=value;this.mark(`${blockName}.${key.value}`,key);this.optionalSemi()}this.expect('}');return result}
  continuity(){const result={lock:[],allow:[],deny:[]};this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('}'))break;const action=this.expectId('Expected continuity action');if(!Object.hasOwn(result,action.value))throw new CharacterGenomeSyntaxError('CHARACTER_CONTINUITY_ACTION',`Unsupported continuity action '${action.value}'`,action);const value=this.value();result[action.value].push(value);this.mark(`continuity.${action.value}.${value}`,action);this.optionalSemi()}this.expect('}');return result}
  parse(){
    const root=this.expect('character','Character Genome source must begin with character'),name=[];while(!this.at('{')&&this.current().type!=='eof')name.push(this.advance().value);if(!name.length)throw new CharacterGenomeSyntaxError('CHARACTER_NAME_REQUIRED','Expected character name',this.current());this.expect('{');const ast={kind:'CharacterGenomeProgram',name:name.join(' '),topology_family:null,seed:null,identity:{},appearance:{},continuity:{lock:[],allow:[],deny:[]},profiles:{},sourceMap:this.sourceMap};
    while(!this.at('}')){this.optionalSemi();if(this.at('}'))break;const key=this.expectId('Expected character declaration');if(key.value==='genome'){this.expect('extends');ast.topology_family=this.value();this.mark('genome.extends',key)}else if(key.value==='seed'){ast.seed=this.value();this.mark('genome.seed',key)}else if(key.value==='identity')ast.identity=this.fields('identity');else if(key.value==='appearance')ast.appearance=this.fields('appearance');else if(key.value==='continuity')ast.continuity=this.continuity();else if(['expression_profile','viseme_profile','motion_profile','voice'].includes(key.value)){ast.profiles[key.value]=this.value();this.mark(`profiles.${key.value}`,key)}else throw new CharacterGenomeSyntaxError('CHARACTER_DECLARATION_UNKNOWN',`Unknown character declaration '${key.value}'`,key);this.optionalSemi()}
    const end=this.expect('}');if(this.current().type!=='eof')throw new CharacterGenomeSyntaxError('CHARACTER_TRAILING_CONTENT','Unexpected content after character block',this.current());this.mark('character',root,end);ast.sourceRoot=createHash('sha256').update(this.source).digest('hex');return ast;
  }
}

export function parseCharacterGenomeSource(source){return new Parser(String(source)).parse()}
