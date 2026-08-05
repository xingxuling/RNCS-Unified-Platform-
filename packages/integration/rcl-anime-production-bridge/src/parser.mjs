import {createHash} from 'node:crypto';

export class AnimeSyntaxError extends Error{
  constructor(code,message,token){super(message);this.name='AnimeSyntaxError';this.code=code;this.location=token?{line:token.line,column:token.column,offset:token.start,end:token.end}:null;this.token=token??null}
}

function isIdStart(ch){return Boolean(ch)&&(/[\p{L}_]/u).test(ch)}
function isIdPart(ch){return Boolean(ch)&&(/[\p{L}\p{N}_-]/u).test(ch)}

export function lexAnime(source){
  const tokens=[];let index=0,line=1,column=1;
  const push=(type,value,startLine=line,startColumn=column,start=index)=>tokens.push({type,value,line:startLine,column:startColumn,start,end:index});
  const advance=()=>{const ch=source[index++];if(ch==='\n'){line++;column=1}else column++;return ch};
  while(index<source.length){
    const ch=source[index];
    if(/\s/u.test(ch)){advance();continue}
    if(ch==='/'&&source[index+1]==='/'){while(index<source.length&&advance()!=='\n');continue}
    const start=index,startLine=line,startColumn=column;
    if(ch==='"'||ch==="'"){
      const quote=advance();let value='',closed=false;
      while(index<source.length){const c=advance();if(c===quote){closed=true;break}if(c==='\\'&&index<source.length){const escaped=advance();value+=escaped==='n'?'\n':escaped==='r'?'\r':escaped==='t'?'\t':escaped}else value+=c}
      if(!closed)throw new AnimeSyntaxError('ANIME_STRING_UNTERMINATED','Unterminated string literal',{line:startLine,column:startColumn,start,end:index});
      push('string',value,startLine,startColumn,start);continue;
    }
    if(/[0-9-]/u.test(ch)){
      let raw=advance();while(index<source.length&&/[0-9.]/u.test(source[index]))raw+=advance();push('number',raw,startLine,startColumn,start);continue;
    }
    if(isIdStart(ch)){
      let raw=advance();while(index<source.length&&isIdPart(source[index]))raw+=advance();push('id',raw,startLine,startColumn,start);continue;
    }
    if(source.slice(index,index+2)==='..'||source.slice(index,index+2)==='->'){advance();advance();push('symbol',source.slice(start,start+2),startLine,startColumn,start);continue}
    if('{}:.,;={}()'.includes(ch)){advance();push('symbol',ch,startLine,startColumn,start);continue}
    throw new AnimeSyntaxError('ANIME_TOKEN_UNEXPECTED',`Unexpected character '${ch}'`,{line:startLine,column:startColumn,start,end:start+1});
  }
  tokens.push({type:'eof',value:'<eof>',line,column,start:index,end:index});return tokens;
}

const hashText=value=>createHash('sha256').update(String(value)).digest('hex');

class Parser{
  constructor(source){this.source=source;this.tokens=lexAnime(source);this.index=0;this.sourceMap={}}
  current(){return this.tokens[this.index]}
  at(value){return this.current().value===value}
  atType(type){return this.current().type===type}
  advance(){const token=this.current();if(token.type!=='eof')this.index++;return token}
  expect(value,message=`Expected '${value}'`){if(!this.at(value))throw new AnimeSyntaxError('ANIME_SYNTAX',message,this.current());return this.advance()}
  expectType(type,message=`Expected ${type}`){if(!this.atType(type))throw new AnimeSyntaxError('ANIME_SYNTAX',message,this.current());return this.advance()}
  optionalSemi(){while(this.at(';'))this.advance()}
  mark(path,start,end=start,kind='AnimeNode'){this.sourceMap[path]={kind,line:start.line,column:start.column,end_line:end.line,end_column:end.column,offset:start.start,end_offset:end.end};return path}
  path(){let value=this.expectType('id','Expected identifier').value;while(this.at(':')||this.at('.')){value+=this.advance().value;value+=this.expectType('id','Expected identifier after path separator').value}return value}
  headerName(){const names=[];while(!this.at('{')&&!this.atType('eof'))names.push(this.advance().value);if(!names.length)throw new AnimeSyntaxError('ANIME_NAME_REQUIRED','Expected block name',this.current());return names.join(' ')}
  number(){return Number(this.expectType('number','Expected number').value)}
  resolution(){const width=this.number();if(this.atType('id')&&/^x\d+$/u.test(this.current().value)){const token=this.advance();return{width,height:Number(token.value.slice(1))}}this.expect('x','Expected x in resolution');return{width,height:this.number()}}
  scalar(){const value=this.number();let unit='';if(this.atType('id')&&['s','f','mm','deg'].includes(this.current().value))unit=this.advance().value;return{value,unit}}
  frame(){const scalar=this.scalar();return scalar.unit==='f'?Math.round(scalar.value):Math.round(scalar.value*24)}
  seconds(){const scalar=this.scalar();return scalar.unit==='s'?scalar.value:scalar.value/24}
  bool(){const value=this.expectType('id','Expected boolean').value;if(value!=='true'&&value!=='false')throw new AnimeSyntaxError('ANIME_BOOLEAN_INVALID',`Expected true or false, found '${value}'`,this.current());return value==='true'}
  block(open=true){if(open)this.expect('{');const statements=[];while(!this.at('}')&&!this.atType('eof'))statements.push(this.advance());this.expect('}');return statements}
  parse(){
    const root=this.expect('anime','Anime source must begin with anime'),name=this.expectType('id','Expected anime name');this.expect('{');const episodes=[];
    while(!this.at('}')){this.optionalSemi();if(this.at('episode'))episodes.push(this.parseEpisode());else throw new AnimeSyntaxError('ANIME_TOP_LEVEL_UNKNOWN',`Expected episode, found '${this.current().value}'`,this.current())}
    const end=this.expect('}');if(!this.atType('eof'))throw new AnimeSyntaxError('ANIME_TRAILING_CONTENT','Unexpected content after anime block',this.current());this.mark('anime',root,end,'AnimeProduction');return{kind:'AnimeProgram',name:name.value,episodes,sourceMap:this.sourceMap,sourceRoot:hashText(this.source)};
  }
  parseEpisode(){const start=this.expect('episode'),id=this.expectType('id','Expected episode id'),node={kind:'Episode',episode_id:id.value,scenes:[],location:{line:start.line,column:start.column}};this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('scene'))node.scenes.push(this.parseScene());else throw new AnimeSyntaxError('ANIME_EPISODE_UNKNOWN',`Expected scene, found '${this.current().value}'`,this.current())}const end=this.expect('}');this.mark(`episode.${id.value}`,start,end,'Episode');return node}
  parseScene(){const start=this.expect('scene'),name=this.headerName(),node={kind:'Scene',scene_id:name,settings:{},cuts:[],location:{line:start.line,column:start.column}};this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('fps')){this.advance();node.settings.fps=this.number();this.optionalSemi()}else if(this.at('resolution')){this.advance();node.settings.resolution=this.resolution();this.optionalSemi()}else if(this.at('style')){this.advance();node.settings.style=this.path();this.optionalSemi()}else if(this.at('cut'))node.cuts.push(this.parseCut());else throw new AnimeSyntaxError('ANIME_SCENE_UNKNOWN',`Unknown scene declaration '${this.current().value}'`,this.current())}const end=this.expect('}');this.mark(`scene.${name}`,start,end,'Scene');return node}
  parseCut(){
    const start=this.expect('cut'),cutId=this.expectType('id','Expected cut id');this.expect('duration');const duration=this.seconds();const node={kind:'Cut',cut_id:cutId.value,duration,fps:24,resolution:{width:1920,height:1080},layout:'medium_close_up',mode:'native-2d',camera_track:[],background_layers:[],character_layers:[],key_pose_track:[],inbetween_track:[],facial_track:[],gaze_track:[],blink_track:[],mouth_track:[],dialogue_track:[],voice_track:[],ambience_track:[],foley_track:[],sfx_track:[],music_track:[],lighting_track:[],effect_track:[],composite_track:[],correction_track:[],secondary_motion_track:[],animation:{},metadata:{location:{line:start.line,column:start.column}}};this.expect('{');
    while(!this.at('}')){this.optionalSemi();if(this.at('layout')){this.advance();node.layout=this.path()}else if(this.at('mode')){this.advance();node.mode=this.path()}else if(this.at('fps')){this.advance();node.fps=this.number()}else if(this.at('resolution')){this.advance();node.resolution=this.resolution()}else if(this.at('camera'))this.parseCamera(node);else if(this.at('background'))this.parseBackground(node);else if(this.at('actor'))this.parseActor(node);else if(this.at('animation'))this.parseAnimation(node);else if(this.at('sound'))this.parseSound(node);else throw new AnimeSyntaxError('ANIME_CUT_UNKNOWN',`Unknown cut declaration '${this.current().value}'`,this.current())}
    const end=this.expect('}');node.metadata.source_location={line:start.line,column:start.column,end_line:end.line,end_column:end.column};this.mark(`cut.${cutId.value}`,start,end,'Cut');return node;
  }
  parseCamera(node){const start=this.expect('camera');this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('lens')){this.advance();const v=this.scalar();node.camera_track.push({kind:'lens',lens_mm:v.value,unit:v.unit,source:{line:start.line,column:start.column}})}else if(this.at('angle')){this.advance();const direction=this.path();const v=this.scalar();node.camera_track.push({kind:'angle',direction,angle_deg:v.value})}else if(this.at('dolly_in')){this.advance();this.expect('from');const from=this.seconds();this.expect('to');const to=this.seconds();this.expect('easing');const easing=this.path();node.camera_track.push({kind:'dolly_in',start:from,end:to,easing,dolly:0.055})}else if(this.at('pan')){this.advance();this.expect('from');const from=this.seconds();this.expect('to');const to=this.seconds();node.camera_track.push({kind:'pan',start:from,end:to,x:0.08})}else throw new AnimeSyntaxError('ANIME_CAMERA_UNKNOWN',`Unknown camera declaration '${this.current().value}'`,this.current())}this.expect('}');this.mark(`cut.${node.cut_id}.camera`,start,this.tokens[this.index-1],'Camera')}
  parseBackground(node){const start=this.expect('background'),asset=this.path();node.background_layers.push({layer_id:`background:${asset}`,asset_id:asset,mode:'2.5d',depth:0.4,parallax:0.08});this.mark(`cut.${node.cut_id}.background`,start,this.tokens[this.index-1],'BackgroundLayer');this.optionalSemi()}
  parseActor(node){const start=this.expect('actor'),name=this.headerName(),actor={actor_id:name,asset_id:null,keyposes:[],holds:[],gaze:[],blinks:[],dialogues:[],expression_holds:[]};this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('asset')){this.advance();actor.asset_id=this.path()}else if(this.at('keypose')){const key=this.advance(),frame=this.frame(),pose=this.path();actor.keyposes.push({frame,pose_id:pose,actor_id:name,source:{line:key.line,column:key.column}})}else if(this.at('hold')){const key=this.advance(),from=this.frame();this.expect('..');const to=this.frame();actor.holds.push({start:from,end:to,source:{line:key.line,column:key.column}})}else if(this.at('gaze')){const key=this.advance(),target=this.path();this.expect('from');const from=this.frame();actor.gaze.push({target,frame:from,source:{line:key.line,column:key.column}})}else if(this.at('blink')){const key=this.advance();this.expect('at');const frame=this.frame();actor.blinks.push({frame,source:{line:key.line,column:key.column}})}else if(this.at('dialogue'))actor.dialogues.push(this.parseDialogue(name,node.cut_id));else if(this.at('hold_expression')){const key=this.advance();this.expect('from');const from=this.path();this.expect('to');const to=this.path();actor.expression_holds.push({from,to,source:{line:key.line,column:key.column}})}else throw new AnimeSyntaxError('ANIME_ACTOR_UNKNOWN',`Unknown actor declaration '${this.current().value}'`,this.current())}const end=this.expect('}');node.character_layers.push({layer_id:`character:${name}`,actor_id:name,asset_id:actor.asset_id??`character:${name}`,mode:'native-2d'});node.key_pose_track.push(...actor.keyposes);node.gaze_track.push(...actor.gaze);node.blink_track.push(...actor.blinks);node.metadata.actor=actor;this.mark(`cut.${node.cut_id}.actor.${name}`,start,end,'Actor');}
  parseDialogue(actorId,cutId){const start=this.expect('dialogue'),node={dialogue_event_id:`dialogue:${hashText(`${cutId}:${actorId}:${this.tokens[this.index].start}`).slice(0,24)}`,actor_id:actorId,text:'',start_frame:0,voice_identity:`${actorId}.default`,emotion:'neutral',mouth:'automatic_viseme',close_mouth_on_end:true};this.expect('{');while(!this.at('}')){this.optionalSemi();if(this.at('text')){this.advance();node.text=this.expectType('string','Expected dialogue text').value}else if(this.at('start')){this.advance();node.start_frame=this.frame()}else if(this.at('voice')){this.advance();node.voice_identity=this.path()}else if(this.at('emotion')){this.advance();node.emotion=this.path()}else if(this.at('mouth')){this.advance();node.mouth=this.path()}else if(this.at('close_mouth_on_end')){this.advance();node.close_mouth_on_end=this.bool()}else throw new AnimeSyntaxError('ANIME_DIALOGUE_UNKNOWN',`Unknown dialogue declaration '${this.current().value}'`,this.current())}const end=this.expect('}');node.source={line:start.line,column:start.column,end_line:end.line,end_column:end.column};return node}
  parseAnimation(node){this.expect('animation');this.expect('{');while(!this.at('}')){this.optionalSemi();const key=this.advance();if(key.value==='exposure'||key.value==='hair_secondary'||key.value==='coat_secondary')node.animation[key.value]=this.path();else if(key.value==='motion_override'){const layer=this.path();this.expect('from');const startFrame=this.frame();this.expect('to');const endFrame=this.frame();this.expect('amplitude');const amplitude=this.number();this.expect('reason');const reason=this.expectType('string','Expected motion override reason').value;node.secondary_motion_track.push({layer,start_frame:startFrame,end_frame:endFrame,amplitude,reason,source:{line:key.line,column:key.column}})}else throw new AnimeSyntaxError('ANIME_ANIMATION_UNKNOWN',`Unknown animation declaration '${key.value}'`,key)}this.expect('}')}
  parseSound(node){this.expect('sound');this.expect('{');while(!this.at('}')){this.optionalSemi();const key=this.advance();const value=this.path();if(key.value==='ambience')node.ambience_track.push({cue_id:`ambience:${value}`,sound:value,start_frame:0,end_frame:Math.round(node.duration*node.fps)});else if(key.value==='foley')node.foley_track.push({cue_id:`foley:${value}`,sound:value,start_frame:0,end_frame:Math.round(node.duration*node.fps)});else if(key.value==='sfx')node.sfx_track.push({cue_id:`sfx:${value}`,sound:value,start_frame:0,end_frame:Math.round(node.duration*node.fps)});else if(key.value==='music')node.music_track.push({cue_id:`music:${value}`,sound:value,start_frame:0,end_frame:Math.round(node.duration*node.fps)});else throw new AnimeSyntaxError('ANIME_SOUND_UNKNOWN',`Unknown sound declaration '${key.value}'`,key)}this.expect('}')}
}

export function parseAnimeSource(source){return new Parser(source).parse()}
