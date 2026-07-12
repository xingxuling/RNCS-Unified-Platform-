import {deepGet} from './canonical.mjs';

function entityValue(state,id,path){const e=state.entities?.[id];if(!e)return undefined;return deepGet(e.variables,path)??deepGet(e.components,path)??deepGet(e,path);}
export function resolveRef(ref,ctx){
  if(typeof ref!=='string'||!ref.startsWith('$'))return ref;
  const key=ref.slice(1);
  if(key==='tick')return ctx.state.tick;if(key==='time')return ctx.state.time;if(key==='random')return ctx.random();
  if(key.startsWith('globals.'))return deepGet(ctx.state.globals,key.slice(8));
  if(key.startsWith('self.'))return entityValue(ctx.state,ctx.entityId,key.slice(5));
  if(key.startsWith('event.'))return deepGet(ctx.event?.payload??{},key.slice(6));
  if(key.startsWith('input.'))return deepGet(ctx.state.input,key.slice(6));
  if(key.startsWith('entity:')){const rest=key.slice(7);const dot=rest.indexOf('.');const id=dot<0?rest:rest.slice(0,dot);const path=dot<0?'':rest.slice(dot+1);return entityValue(ctx.state,id,path);}
  if(key.startsWith('machine:')){const rest=key.slice(8);const dot=rest.indexOf('.');const id=dot<0?rest:rest.slice(0,dot);const path=dot<0?'state':rest.slice(dot+1);return deepGet(ctx.state.machines?.[id],path);}
  return undefined;
}
export function evalValue(expr,ctx){
  if(expr===null||typeof expr==='number'||typeof expr==='boolean')return expr;
  if(typeof expr==='string')return resolveRef(expr,ctx);
  if(Array.isArray(expr))return expr.map(x=>evalValue(x,ctx));
  if(!expr||typeof expr!=='object')return expr;
  if('literal'in expr)return expr.literal;
  if('ref'in expr)return resolveRef(`$${expr.ref}`,ctx);
  const one=name=>evalValue(expr[name],ctx);const many=name=>(expr[name]??[]).map(x=>evalValue(x,ctx));
  if('add'in expr)return many('add').reduce((a,b)=>Number(a)+Number(b),0);
  if('sub'in expr){const v=many('sub');return v.slice(1).reduce((a,b)=>Number(a)-Number(b),Number(v[0]??0));}
  if('mul'in expr)return many('mul').reduce((a,b)=>Number(a)*Number(b),1);
  if('div'in expr){const v=many('div');return v.slice(1).reduce((a,b)=>Number(b)===0?a:Number(a)/Number(b),Number(v[0]??0));}
  if('min'in expr)return Math.min(...many('min').map(Number));
  if('max'in expr)return Math.max(...many('max').map(Number));
  if('abs'in expr)return Math.abs(Number(one('abs')));
  if('round'in expr)return Math.round(Number(one('round')));
  if('floor'in expr)return Math.floor(Number(one('floor')));
  if('ceil'in expr)return Math.ceil(Number(one('ceil')));
  if('distance'in expr){const [a,b]=many('distance');return Math.hypot(Number(a?.x??0)-Number(b?.x??0),Number(a?.y??0)-Number(b?.y??0));}
  if('vec2'in expr){const [x,y]=many('vec2');return{x:Number(x),y:Number(y)};}
  if('concat'in expr)return many('concat').join('');
  if('choose'in expr){const [c,a,b]=expr.choose;return evalCondition(c,ctx)?evalValue(a,ctx):evalValue(b,ctx);}
  const out={};for(const [k,v]of Object.entries(expr))out[k]=evalValue(v,ctx);return out;
}
export function evalCondition(cond,ctx){
  if(cond===undefined||cond===null)return true;if(typeof cond==='boolean')return cond;if(typeof cond==='string')return Boolean(resolveRef(cond,ctx));
  if(Array.isArray(cond))return cond.every(x=>evalCondition(x,ctx));
  if(cond.all)return cond.all.every(x=>evalCondition(x,ctx));if(cond.any)return cond.any.some(x=>evalCondition(x,ctx));if(cond.not)return!evalCondition(cond.not,ctx);
  if(cond.exists!==undefined)return evalValue(cond.exists,ctx)!==undefined;
  if(cond.changed){return ctx.runtime?.changedPaths?.has(String(cond.changed))??false;}
  if(cond.distance_lte){const [a,b,max]=cond.distance_lte.map(x=>evalValue(x,ctx));return Math.hypot(Number(a?.x??0)-Number(b?.x??0),Number(a?.y??0)-Number(b?.y??0))<=Number(max);}
  if(cond.distance_gte){const [a,b,min]=cond.distance_gte.map(x=>evalValue(x,ctx));return Math.hypot(Number(a?.x??0)-Number(b?.x??0),Number(a?.y??0)-Number(b?.y??0))>=Number(min);}
  const ops={eq:(a,b)=>a===b,neq:(a,b)=>a!==b,gt:(a,b)=>Number(a)>Number(b),gte:(a,b)=>Number(a)>=Number(b),lt:(a,b)=>Number(a)<Number(b),lte:(a,b)=>Number(a)<=Number(b),includes:(a,b)=>Array.isArray(a)?a.includes(b):String(a??'').includes(String(b)),in:(a,b)=>Array.isArray(b)&&b.includes(a)};
  for(const [op,fn]of Object.entries(ops))if(cond[op]){const [a,b]=cond[op].map(x=>evalValue(x,ctx));return fn(a,b);}
  return Boolean(evalValue(cond,ctx));
}
