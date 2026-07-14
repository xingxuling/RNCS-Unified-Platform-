import {BehaviorRuntime,normalizeProgram,validateProgram} from '@taowind/reality-behavior-fabric';
import {clone} from './contracts.mjs';

export function createAetherIslandProgram(version='1.0.0'){
 return normalizeProgram({
  identity:{program_id:'behavior:aether-island-sensor-v1',title:'以太岛感应联动',description:'玩家进入感应区后驱动门、灯光与环境声音',version},
  seed:'aether-island-sensor-v1',tick_rate:60,globals:{ambient_sound:'stopped'},
  entities:[{entity_id:'door',tags:['door'],variables:{open:false}},{entity_id:'lamp',tags:['light'],variables:{intensity:1}}],
  rules:[{rule_id:'rule:player-entered-zone',event:'player.entered-zone',actions:[
   {type:'set',target:'entity:door.open',value:true},{type:'set',target:'entity:lamp.intensity',value:2},{type:'set',target:'globals.ambient_sound',value:'playing'},
   {type:'call',capability_id:'rsr.authority-command',inputs:{command:'open-door'}},{type:'call',capability_id:'vsr.presentation-event',inputs:{event:'energy-light-boost'}},{type:'call',capability_id:'audio.environment.emit',inputs:{cue:'aether-island-awaken'}}
  ]}],
  capabilities:[
   {capability_id:'rsr.authority-command',required_scopes:['physics.write'],risk:'medium',irreversible:false},
   {capability_id:'vsr.presentation-event',required_scopes:['projection.write'],risk:'low',irreversible:false},
   {capability_id:'audio.environment.emit',required_scopes:['audio.emit'],risk:'low',irreversible:false}
  ],
  authority:{default_effect:'deny',policies:[{policy_id:'allow-runtime',effect:'allow',priority:10,roles_any:['runtime'],capabilities:['*'],risk_at_most:'medium'}]}
 });
}
export function createBehaviorRegistration({providers={},program:inputProgram=null}={}){
 const program=normalizeProgram(inputProgram??createAetherIslandProgram());const validation=validateProgram(program);if(!validation.valid)throw new Error(`BEHAVIOR_PROGRAM_INVALID:${JSON.stringify(validation.errors)}`);
 const programScopes=program.capabilities.flatMap(capability=>capability.required_scopes??[]);
 const scopes=[...new Set(['physics.write','projection.write','audio.emit',...programScopes])];
 const runtime=new BehaviorRuntime(program,{providers,actor:{subject_id:'subject:behavior-runtime',roles:['runtime'],scopes}});
 return {behavior_id:program.identity.program_id,version:program.identity.version,enabled:true,program,program_root:program.program_root,validation,runtime};
}
export function triggerBehavior(registration,event,payload={}){
 if(!registration.enabled)throw new Error('BEHAVIOR_DISABLED');
 registration.runtime.bus.emit(event,clone(payload),{phase:'simulation',source:payload.source??'rncs',target:payload.target??null});
 const tick=registration.runtime.tick(payload.input??{});
 return {state:clone(registration.runtime.state),delta:registration.runtime.causalDelta(),trace:registration.runtime.exportTrace(),tick};
}
export function triggerAetherIslandBehavior(registration,payload){
 if(!registration.enabled)throw new Error('BEHAVIOR_DISABLED');
 registration.runtime.bus.emit('player.entered-zone',clone(payload),{phase:'simulation',source:payload.player_id,target:payload.zone_id});
 registration.runtime.tick({});
 return {state:clone(registration.runtime.state),delta:registration.runtime.causalDelta(),trace:registration.runtime.exportTrace()};
}
