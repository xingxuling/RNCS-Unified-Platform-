import {
  deepClone, documentHash, semanticHash, validateDocument,
  type VSRClip, type VSRContext, type VSRDiagnostic, type VSRDisplayItem, type VSRDisplayState, type VSRDocument,
  type VSREasing, type VSREvent, type VSRKeyframe, type VSRLayout, type VSRLength, type VSRMatrix3,
  type VSRNode, type VSRPaint, type VSRRect, type VSRState, type VSRTrack, type VSRValue, type VSRValueSource
} from '../../spec/src/index.js';
import { evaluateExpression, parseExpression, type ParsedExpression } from '../../expression/src/index.js';

export const VSR_RUNTIME_VERSION = '0.3.0-alpha.1';

export interface VSRPreparedTrack extends VSRTrack { parsedExpression?: ParsedExpression; stableIndex: number }
export interface VSRPreparedSource { path: string; binding?: string; parsedExpression?: ParsedExpression }
export type VSRPreparedNode = VSRNode & {
  stableIndex: number;
  preparedTracks: VSRPreparedTrack[];
  preparedSources: Map<string, VSRPreparedSource>;
  dependencies: Set<string>;
  timeDependent: boolean;
  layoutDependent: boolean;
};
export interface VSRDependencyGraph {
  variableToNodes: Map<string, Set<string>>;
  contextToNodes: Map<string, Set<string>>;
  inputToNodes: Map<string, Set<string>>;
  timeDependentNodes: Set<string>;
  layoutDependentNodes: Set<string>;
  descendantsByNode: Map<string, Set<string>>;
}
export interface VSRPreparedDocument {
  document: Readonly<VSRDocument>; documentHash: string; nodes: VSRPreparedNode[];
  nodeById: Map<string, VSRPreparedNode>; childrenByParent: Map<string | null, VSRPreparedNode[]>;
  parentByNode: Map<string, string | null>; displayOrderNodes: VSRPreparedNode[];
  eventsSorted: VSREvent[]; diagnostics: VSRDiagnostic[]; dependencyGraph: VSRDependencyGraph;
}
export interface VSRProjectionSnapshot {
  activeVisible: boolean;
  localBounds: VSRRect;
  worldTransform: VSRMatrix3;
  opacity: number;
  clipStack: VSRClip[];
  item?: VSRDisplayItem;
  itemHash?: string;
}
export interface VSRIncrementalCache {
  documentHash?: string;
  time?: number;
  context?: VSRContext;
  state?: VSRState;
  runtimeOverrides?: Record<string, VSRValue>;
  resolvedById: Map<string, Record<string, unknown>>;
  projectionById: Map<string, VSRProjectionSnapshot>;
}
export interface VSREvaluateRequest {
  document: VSRDocument | VSRPreparedDocument; time: number; context?: Partial<VSRContext>;
  initialState?: Partial<VSRState>; events?: VSREvent[]; runtimeOverrides?: Record<string, VSRValue>;
  incrementalCache?: VSRIncrementalCache;
}
export interface VSREvaluateResult {
  state: VSRState; displayState: VSRDisplayState; diagnostics: VSRDiagnostic[]; semanticHash: string;
  evaluationStats: {
    durationMs: number; nodeCount: number; visibleItemCount: number; eventCount: number;
    resolvedNodeCount: number; reusedResolvedNodeCount: number; dirtyNodeCount: number; changedDependencies: string[];
    projectedNodeCount: number; reusedProjectionNodeCount: number; skippedProjectionSubtreeCount: number;
    skippedProjectionNodeCount: number; reusedDisplayItemCount: number; displayHashMode: 'item-manifest-v1';
  };
}

export function createIncrementalCache(): VSRIncrementalCache { return { resolvedById: new Map(), projectionById: new Map() }; }

const identity: VSRMatrix3 = [1,0,0,0,1,0,0,0,1];
function multiply(a: VSRMatrix3, b: VSRMatrix3): VSRMatrix3 {
  const out = new Array<number>(9).fill(0);
  for (let r=0;r<3;r++) for (let c=0;c<3;c++) for (let k=0;k<3;k++) out[r*3+c]! += a[r*3+k]! * b[k*3+c]!;
  return out as VSRMatrix3;
}
function translation(x:number,y:number):VSRMatrix3 { return [1,0,x,0,1,y,0,0,1]; }
function scaling(x:number,y:number):VSRMatrix3 { return [x,0,0,0,y,0,0,0,1]; }
function rotation(deg:number):VSRMatrix3 { const r=deg*Math.PI/180,c=Math.cos(r),s=Math.sin(r); return [c,-s,0,s,c,0,0,0,1]; }
function skew(xDeg:number,yDeg:number):VSRMatrix3 { return [1,Math.tan(xDeg*Math.PI/180),0,Math.tan(yDeg*Math.PI/180),1,0,0,0,1]; }
function applyMatrix(m:VSRMatrix3,x:number,y:number):{x:number;y:number} { return { x:m[0]*x+m[1]*y+m[2], y:m[3]*x+m[4]*y+m[5] }; }
function transformBounds(m:VSRMatrix3, b:VSRRect):VSRRect {
  const pts=[applyMatrix(m,b.x,b.y),applyMatrix(m,b.x+b.width,b.y),applyMatrix(m,b.x+b.width,b.y+b.height),applyMatrix(m,b.x,b.y+b.height)];
  const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y); const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
  return {x:minX,y:minY,width:maxX-minX,height:maxY-minY};
}

function diag(code:string,severity:'info'|'warning'|'error'|'fatal',message:string,extra:Partial<VSRDiagnostic>={}):VSRDiagnostic {
  return { code,severity,message,messageZh:message,...extra };
}

function expressionUsesTime(source:string):boolean { return /\b(time|frame|fps)\b/.test(source); }
function addGraphEntry(map:Map<string,Set<string>>,key:string,nodeId:string):void { const set=map.get(key)??new Set<string>();set.add(nodeId);map.set(key,set); }
function collectPreparedSources(value:unknown,path:string,out:Map<string,VSRPreparedSource>,dependencies:Set<string>,diagnostics:VSRDiagnostic[],nodeId:string):{timeDependent:boolean;layoutDependent:boolean} {
  let timeDependent=false,layoutDependent=false;
  if(isSource(value)) {
    if(value.binding){out.set(path,{path,binding:value.binding});dependencies.add(value.binding);}
    if(value.expression){try{const parsedExpression=parseExpression(value.expression);out.set(path,{path,parsedExpression});for(const dep of parsedExpression.dependencies)dependencies.add(dep);if(expressionUsesTime(value.expression))timeDependent=true;}catch(error){diagnostics.push(diag('EXPR_PARSE','error',`表达式解析失败：${error instanceof Error?error.message:String(error)}`,{nodeId,path}));}}
    return {timeDependent,layoutDependent};
  }
  if(Array.isArray(value)){for(let i=0;i<value.length;i++){const nested=collectPreparedSources(value[i],path?`${path}.${i}`:String(i),out,dependencies,diagnostics,nodeId);timeDependent ||= nested.timeDependent;layoutDependent ||= nested.layoutDependent;}return{timeDependent,layoutDependent};}
  if(value&&typeof value==='object')for(const[k,v]of Object.entries(value as Record<string,unknown>)){if(path===''&&k==='tracks')continue;const nested=collectPreparedSources(v,path?`${path}.${k}`:k,out,dependencies,diagnostics,nodeId);timeDependent ||= nested.timeDependent;layoutDependent ||= nested.layoutDependent;}
  if(typeof value==='string'&&(/%$|vw$|vh$/.test(value)))layoutDependent=true;
  return {timeDependent,layoutDependent};
}

export function prepareDocument(document: VSRDocument): VSRPreparedDocument {
  const validation = validateDocument(document);
  if (!validation.ok) {
    const fatal = validation.diagnostics.find(d=>d.severity==='fatal' || d.severity==='error');
    throw new Error(fatal?.message ?? 'VSR document validation failed.');
  }
  const diagnostics=[...validation.diagnostics];
  const nodes:VSRPreparedNode[]=document.nodes.map((node,stableIndex)=>{
    const dependencies=new Set<string>();const preparedSources=new Map<string,VSRPreparedSource>();
    const sourceInfo=collectPreparedSources(node,'',preparedSources,dependencies,diagnostics,node.id);
    let timeDependent=sourceInfo.timeDependent||Boolean(node.active);let layoutDependent=sourceInfo.layoutDependent||Boolean(node.layout?.responsive?.length);
    const preparedTracks:VSRPreparedTrack[]=(node.tracks??[]).map((track,index)=>{
      let parsedExpression:ParsedExpression|undefined;
      if (track.mode==='expression' && track.expression) {
        try { parsedExpression=parseExpression(track.expression);for(const dep of parsedExpression.dependencies)dependencies.add(dep);if(expressionUsesTime(track.expression))timeDependent=true; }
        catch(error){ diagnostics.push(diag('EXPR_PARSE','error',`表达式解析失败：${error instanceof Error?error.message:String(error)}`,{nodeId:node.id,trackId:track.id})); }
      }
      if(track.mode==='binding'&&track.binding)dependencies.add(track.binding);
      if(track.mode==='keyframes'&&(track.keyframes?.length??0)>1)timeDependent=true;
      if(track.property.startsWith('layout.'))layoutDependent=true;
      return {...track,stableIndex:index,parsedExpression};
    });
    if(layoutDependent){dependencies.add('context.width');dependencies.add('context.height');dependencies.add('context.aspect');}
    return {...node,stableIndex,preparedTracks,preparedSources,dependencies,timeDependent,layoutDependent} as VSRPreparedNode;
  });
  const nodeById=new Map(nodes.map(n=>[n.id,n]));
  const parentByNode=new Map<string,string|null>(nodes.map(n=>[n.id,n.parentId??null]));
  const childrenByParent=new Map<string|null,VSRPreparedNode[]>();
  for(const node of nodes){ const key=node.parentId??null; const list=childrenByParent.get(key)??[]; list.push(node); childrenByParent.set(key,list); }
  for(const list of childrenByParent.values()) list.sort(stableNodeCompare);
  const descendantsByNode=new Map<string,Set<string>>();
  const descendants=(id:string):Set<string>=>{const cached=descendantsByNode.get(id);if(cached)return cached;const set=new Set<string>();for(const child of childrenByParent.get(id)??[]){set.add(child.id);for(const nested of descendants(child.id))set.add(nested);}descendantsByNode.set(id,set);return set;};
  for(const node of nodes)descendants(node.id);
  const dependencyGraph:VSRDependencyGraph={variableToNodes:new Map(),contextToNodes:new Map(),inputToNodes:new Map(),timeDependentNodes:new Set(),layoutDependentNodes:new Set(),descendantsByNode};
  for(const node of nodes){for(const dep of node.dependencies){if(dep.startsWith('vars.'))addGraphEntry(dependencyGraph.variableToNodes,dep,node.id);else if(dep.startsWith('context.'))addGraphEntry(dependencyGraph.contextToNodes,dep,node.id);else if(dep.startsWith('input.'))addGraphEntry(dependencyGraph.inputToNodes,dep,node.id);}if(node.timeDependent)dependencyGraph.timeDependentNodes.add(node.id);if(node.layoutDependent)dependencyGraph.layoutDependentNodes.add(node.id);}
  const eventsSorted=[...(document.events??[])].sort(stableEventCompare);
  const displayOrderNodes=nodes.filter(node=>node.type!=='group').sort((a,b)=>nodeOrderKey(a).localeCompare(nodeOrderKey(b)));
  return {document:deepClone(document),documentHash:documentHash(document),nodes,nodeById,childrenByParent,parentByNode,displayOrderNodes,eventsSorted,diagnostics,dependencyGraph};
}
function nodeOrderKey(node:VSRPreparedNode):string { return `${String(node.zIndex??0).padStart(8,'0')}:${String(node.order??0).padStart(8,'0')}:${String(node.stableIndex).padStart(8,'0')}:${node.id}`; }
function stableNodeCompare(a:VSRPreparedNode,b:VSRPreparedNode):number { return (a.zIndex??0)-(b.zIndex??0)||(a.order??0)-(b.order??0)||a.stableIndex-b.stableIndex||a.id.localeCompare(b.id); }
function stableEventCompare(a:VSREvent,b:VSREvent):number { return a.time-b.time||(a.order??0)-(b.order??0)||a.id.localeCompare(b.id); }

function setPath(target:Record<string,unknown>, path:string, value:unknown):void {
  const parts=path.split('.').filter(Boolean); if(!parts.length) throw new Error('Empty path.');
  let cursor:Record<string,unknown>=target;
  for(let i=0;i<parts.length-1;i++){ const part=parts[i]!; const next=cursor[part]; if(!next || typeof next!=='object' || Array.isArray(next)) cursor[part]={}; cursor=cursor[part] as Record<string,unknown>; }
  cursor[parts.at(-1)!]=value;
}
function getPath(target:unknown,path:string):unknown {
  let cursor=target; for(const part of path.split('.').filter(Boolean)){ if(cursor===null||typeof cursor!=='object'||!Object.prototype.hasOwnProperty.call(cursor,part)) return undefined; cursor=(cursor as Record<string,unknown>)[part]; } return cursor;
}

export function reduceEvents(initial:VSRState, events:VSREvent[], time:number, diagnostics:VSRDiagnostic[]):VSRState {
  const state=deepClone(initial);
  for(const event of [...events].filter(e=>e.time<=time).sort(stableEventCompare)) {
    try {
      const target=event.target.startsWith('vars.')?event.target.slice(5):event.target;
      const current=getPath(state.variables,target);
      switch(event.type){
        case 'set': setPath(state.variables as Record<string,unknown>,target,deepClone(event.value)); break;
        case 'merge': {
          if(typeof current!=='object'||current===null||Array.isArray(current)||typeof event.value!=='object'||event.value===null||Array.isArray(event.value)) throw new Error('merge requires object values.');
          setPath(state.variables as Record<string,unknown>,target,{...(current as object),...(event.value as object)}); break;
        }
        case 'increment': setPath(state.variables as Record<string,unknown>,target,Number(current??0)+Number(event.value??1)); break;
        case 'toggle': setPath(state.variables as Record<string,unknown>,target,!Boolean(current)); break;
        case 'custom': diagnostics.push(diag('EVENT_CUSTOM_UNSUPPORTED','warning',`自定义事件 ${event.id} 未注册，已跳过。`,{time:event.time})); break;
      }
    } catch(error){ diagnostics.push(diag('EVENT_REDUCE','error',`事件 ${event.id} 归约失败：${error instanceof Error?error.message:String(error)}`,{time:event.time})); }
  }
  return state;
}

function defaultContext(doc:VSRDocument, partial:Partial<VSRContext>={}):VSRContext {
  const width=partial.width??doc.canvas.width, height=partial.height??doc.canvas.height;
  return {width,height,aspect:partial.aspect??width/height,dpr:partial.dpr??doc.canvas.pixelRatio??1,locale:partial.locale??'zh-CN',fps:partial.fps??doc.metadata.defaultFps,input:partial.input??{}};
}
function isSource(value:unknown):value is {binding?:string;expression?:string} { return !!value&&typeof value==='object'&&!Array.isArray(value)&&('binding'in value||'expression'in value); }
function resolveValue(value:unknown, state:VSRState, context:VSRContext, time:number, frame:number, seed:number, scopeId:string, diagnostics:VSRDiagnostic[]):unknown {
  if(!isSource(value)) return value;
  try {
    if(value.binding) return getPath({vars:state.variables,context,input:context.input??{}},value.binding);
    if(value.expression) return evaluateExpression(value.expression,{time,frame,fps:context.fps,vars:state.variables,context:context as unknown as Record<string,VSRValue>,input:(context.input??{}) as Record<string,VSRValue>,seed,scopeId});
  } catch(error){ diagnostics.push(diag('EXPR_EVALUATE','error',`表达式求值失败：${error instanceof Error?error.message:String(error)}`)); }
  return undefined;
}

function ease(progress:number,easing:VSREasing|undefined):number {
  const t=Math.min(1,Math.max(0,progress));
  if(!easing||easing==='linear') return t;
  if(easing==='easeIn') return t*t;
  if(easing==='easeOut') return 1-(1-t)*(1-t);
  if(easing==='easeInOut') return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  if(easing==='stepStart') return t>0?1:0;
  if(easing==='stepEnd') return t>=1?1:0;
  if('spring' in easing){ const c=easing.spring; const mass=c.mass??1, stiffness=c.stiffness??100,damping=c.damping??10,velocity=c.velocity??0; const w0=Math.sqrt(stiffness/mass); const zeta=damping/(2*Math.sqrt(stiffness*mass)); if(zeta<1){const wd=w0*Math.sqrt(1-zeta*zeta); const A=1; const B=(zeta*w0-velocity)/wd; return 1-Math.exp(-zeta*w0*t)*(A*Math.cos(wd*t)+B*Math.sin(wd*t));} return 1-Math.exp(-w0*t); }
  const [x1,y1,x2,y2]=easing.cubicBezier;
  let u=t;
  for(let i=0;i<8;i++){ const x=bezier(u,0,x1,x2,1); const dx=bezierDerivative(u,0,x1,x2,1); if(Math.abs(dx)<1e-7) break; u=Math.min(1,Math.max(0,u-(x-t)/dx)); }
  return bezier(u,0,y1,y2,1);
}
function bezier(t:number,p0:number,p1:number,p2:number,p3:number):number { const u=1-t; return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3; }
function bezierDerivative(t:number,p0:number,p1:number,p2:number,p3:number):number { const u=1-t; return 3*u*u*(p1-p0)+6*u*t*(p2-p1)+3*t*t*(p3-p2); }

function parseColor(color:string):[number,number,number,number]|null {
  const hex=color.trim().match(/^#([0-9a-f]{3,8})$/i); if(hex){ const h=hex[1]!; if(h.length===3||h.length===4){ return [parseInt(h[0]!+h[0]!,16),parseInt(h[1]!+h[1]!,16),parseInt(h[2]!+h[2]!,16),h.length===4?parseInt(h[3]!+h[3]!,16):255]; } if(h.length===6||h.length===8) return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),h.length===8?parseInt(h.slice(6,8),16):255]; }
  const rgb=color.match(/^rgba?\(([^)]+)\)$/i); if(rgb){ const p=rgb[1]!.split(',').map(Number); if(p.length>=3)return [p[0]!,p[1]!,p[2]!,p.length===4?Math.round(p[3]!*255):255]; }
  return null;
}
function interpolateValue(a:VSRValue,b:VSRValue,t:number):VSRValue {
  if(typeof a==='number'&&typeof b==='number') return a+(b-a)*t;
  if(typeof a==='string'&&typeof b==='string'){const ca=parseColor(a),cb=parseColor(b); if(ca&&cb){const c=ca.map((v,i)=>Math.round(v+(cb[i]!-v)*t)); return `rgba(${c[0]},${c[1]},${c[2]},${(c[3]!/255).toFixed(4)})`;}}
  if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every(v=>typeof v==='number')&&b.every(v=>typeof v==='number')) return a.map((v,i)=>(v as number)+((b[i] as number)-(v as number))*t) as VSRValue;
  return t<1?a:b;
}
function evaluateKeyframes(keyframes:VSRKeyframe[],time:number):VSRValue|undefined {
  if(!keyframes.length)return undefined;
  const sorted=[...keyframes].sort((a,b)=>a.time-b.time||(a.order??0)-(b.order??0)||a.id.localeCompare(b.id));
  if(time<=sorted[0]!.time)return sorted[0]!.value;
  if(time>=sorted.at(-1)!.time)return sorted.at(-1)!.value;
  for(let i=0;i<sorted.length-1;i++){const a=sorted[i]!,b=sorted[i+1]!; if(time>=a.time&&time<=b.time){if(a.hold)return a.value; const p=(time-a.time)/(b.time-a.time||1); return interpolateValue(a.value,b.value,ease(p,a.easing));}}
  return sorted.at(-1)!.value;
}

function applyTrackValue(node:Record<string,unknown>,property:string,value:unknown):void { if(value!==undefined) setPath(node,property,value); }
function resolveNode(node:VSRPreparedNode,state:VSRState,context:VSRContext,time:number,frame:number,docSeed:number,overrides:Record<string,VSRValue>,diagnostics:VSRDiagnostic[]):Record<string,unknown> {
  const {preparedTracks:_preparedTracks,preparedSources:_preparedSources,dependencies:_dependencies,timeDependent:_timeDependent,layoutDependent:_layoutDependent,stableIndex:_stableIndex,...rawNode}=node;
  const resolved=deepClone(rawNode) as unknown as Record<string,unknown>;
  const sourceTrace:Record<string,string>={};
  const traverse=(object:unknown,path=''):unknown=>{
    if(isSource(object)){const prepared=node.preparedSources.get(path);try{if(prepared?.binding)return getPath({vars:state.variables,context,input:context.input??{}},prepared.binding);if(prepared?.parsedExpression)return evaluateExpression(prepared.parsedExpression,{time,frame,fps:context.fps,vars:state.variables,context:context as unknown as Record<string,VSRValue>,input:(context.input??{}) as Record<string,VSRValue>,seed:docSeed,scopeId:`${node.id}:${path}`});return resolveValue(object,state,context,time,frame,docSeed,`${node.id}:${path}`,diagnostics);}catch(error){diagnostics.push(diag('EXPR_EVALUATE','error',`表达式求值失败：${error instanceof Error?error.message:String(error)}`,{nodeId:node.id,time}));return undefined;}}
    if(Array.isArray(object)) return object.map((v,i)=>traverse(v,`${path}.${i}`));
    if(object&&typeof object==='object'){const out:Record<string,unknown>={};for(const[k,v]of Object.entries(object as Record<string,unknown>))out[k]=traverse(v,path?`${path}.${k}`:k);return out;}
    return object;
  };
  const base=traverse(resolved) as Record<string,unknown>;
  const tracks=[...node.preparedTracks].sort((a,b)=>(a.priority??0)-(b.priority??0)||(a.order??0)-(b.order??0)||a.stableIndex-b.stableIndex||a.id.localeCompare(b.id));
  for(const track of tracks){
    let value:unknown;
    try {
      if(track.mode==='binding'&&track.binding)value=getPath({vars:state.variables,context,input:context.input??{}},track.binding);
      else if(track.mode==='expression'&&track.parsedExpression)value=evaluateExpression(track.parsedExpression,{time,frame,fps:context.fps,vars:state.variables,context:context as unknown as Record<string,VSRValue>,input:(context.input??{}) as Record<string,VSRValue>,node:base as Record<string,VSRValue>,seed:docSeed,scopeId:`${node.id}:${track.id}`});
      else if(track.mode==='keyframes')value=evaluateKeyframes(track.keyframes??[],time);
      else if(track.mode==='simulation')diagnostics.push(diag('TRACK_SIMULATION_UNSUPPORTED','error',`simulation 轨道 ${track.id} 不受支持。`,{nodeId:node.id,trackId:track.id}));
      if(value!==undefined){applyTrackValue(base,track.property,value);sourceTrace[track.property]=track.mode;}
    }catch(error){diagnostics.push(diag('TRACK_EVALUATE','error',`轨道 ${track.id} 求值失败：${error instanceof Error?error.message:String(error)}`,{nodeId:node.id,trackId:track.id,time}));}
  }
  for(const [path,value] of Object.entries(overrides)) if(path.startsWith(`${node.id}.`)){const property=path.slice(node.id.length+1);applyTrackValue(base,property,value);sourceTrace[property]='runtimeOverride';}
  base.__sourceTrace=sourceTrace;
  return base;
}

function length(value:VSRLength|undefined,parent:number,viewport:number,auto:number):number {
  if(value===undefined||value==='auto')return auto;
  if(typeof value==='number')return value;
  if(value.endsWith('%'))return parent*Number.parseFloat(value)/100;
  if(value.endsWith('vw')||value.endsWith('vh'))return viewport*Number.parseFloat(value)/100;
  return Number(value)||0;
}
function responsiveLayout(layout:VSRLayout|undefined,context:VSRContext):VSRLayout {
  const result={...(layout??{})};
  for(const rule of layout?.responsive??[]){const w=rule.when; if((w.minWidth===undefined||context.width>=w.minWidth)&&(w.maxWidth===undefined||context.width<=w.maxWidth)&&(w.minAspect===undefined||context.aspect>=w.minAspect)&&(w.maxAspect===undefined||context.aspect<=w.maxAspect))Object.assign(result,rule.set);}
  delete result.responsive; return result;
}
function localBounds(node:Record<string,unknown>,parentBounds:VSRRect,context:VSRContext):VSRRect {
  const l=responsiveLayout(node.layout as VSRLayout|undefined,context);
  let width=length(l.width,parentBounds.width,context.width,node.type==='text'?300:100);
  let height=length(l.height,parentBounds.height,context.height,node.type==='text'?60:100);
  if(l.aspectRatio){if(l.width!==undefined&&l.height===undefined)height=width/l.aspectRatio;else if(l.height!==undefined&&l.width===undefined)width=height*l.aspectRatio;}
  width=Math.max(l.minWidth??-Infinity,Math.min(l.maxWidth??Infinity,width));height=Math.max(l.minHeight??-Infinity,Math.min(l.maxHeight??Infinity,height));
  const x=parentBounds.x+length(l.x,parentBounds.width,context.width,0)-width*(l.anchorX??0);
  const y=parentBounds.y+length(l.y,parentBounds.height,context.height,0)-height*(l.anchorY??0);
  return {x,y,width,height};
}
function nodeMatrix(node:Record<string,unknown>,bounds:VSRRect):VSRMatrix3 {
  const t=(node.transform??{}) as Record<string,number>; const ox=bounds.x+(t.originX??0),oy=bounds.y+(t.originY??0);
  return multiply(translation(ox,oy),multiply(translation(t.translateX??0,t.translateY??0),multiply(rotation(t.rotation??0),multiply(skew(t.skewX??0,t.skewY??0),multiply(scaling(t.scaleX??1,t.scaleY??1),translation(-ox,-oy))))));
}
function active(node:Record<string,unknown>,time:number):boolean { const range=node.active as {start?:number;end?:number;includeEnd?:boolean}|undefined; if(!range)return true; return time>=(range.start??0)&&(range.end===undefined||time<range.end||(Boolean(range.includeEnd)&&time===range.end)); }
function visible(node:Record<string,unknown>):boolean { return node.visible===undefined?true:Boolean(node.visible); }
function contentRecord(node:Record<string,unknown>):Record<string,VSRValue> {
  const content=(node.content??{}) as Record<string,unknown>; const out:Record<string,VSRValue>={};
  for(const[k,v]of Object.entries(content)) if(v===null||['string','number','boolean'].includes(typeof v)||Array.isArray(v)||typeof v==='object')out[k]=v as VSRValue;
  return out;
}

function topLevelChanges(previous:Record<string,VSRValue>|undefined,current:Record<string,VSRValue>,prefix:string):string[] {
  if(!previous)return Object.keys(current).map(key=>`${prefix}.${key}`);
  const keys=new Set([...Object.keys(previous),...Object.keys(current)]);const changed:string[]=[];
  for(const key of keys)if(semanticHash(previous[key])!==semanticHash(current[key]))changed.push(`${prefix}.${key}`);
  return changed;
}
function contextChanges(previous:VSRContext|undefined,current:VSRContext):string[] {
  if(!previous)return ['context.width','context.height','context.aspect','context.dpr','context.locale','context.fps',...Object.keys(current.input??{}).map(k=>`input.${k}`)];
  const out:string[]=[];for(const key of ['width','height','aspect','dpr','locale','fps'] as const)if(previous[key]!==current[key])out.push(`context.${key}`);
  out.push(...topLevelChanges((previous.input??{}) as Record<string,VSRValue>,(current.input??{}) as Record<string,VSRValue>,'input'));return out;
}
function addMatchingDependencies(map:Map<string,Set<string>>,changed:string,dirty:Set<string>):void { for(const[dep,nodes]of map)if(dep===changed||dep.startsWith(`${changed}.`)||changed.startsWith(`${dep}.`))for(const id of nodes)dirty.add(id); }
function expandDirty(prepared:VSRPreparedDocument,dirty:Set<string>):void { for(const id of [...dirty])for(const child of prepared.dependencyGraph.descendantsByNode.get(id)??[])dirty.add(child); }
function calculateDirtyNodes(prepared:VSRPreparedDocument,cache:VSRIncrementalCache|undefined,time:number,context:VSRContext,state:VSRState,overrides:Record<string,VSRValue>):{dirty:Set<string>;changed:string[]} {
  if(!cache||cache.documentHash!==prepared.documentHash||!cache.state||!cache.context){return{dirty:new Set(prepared.nodes.map(n=>n.id)),changed:['document']};}
  const dirty=new Set<string>();const changed=[...topLevelChanges(cache.state.variables,state.variables,'vars'),...contextChanges(cache.context,context)];
  if(cache.time!==time){changed.push('time');for(const id of prepared.dependencyGraph.timeDependentNodes)dirty.add(id);}
  for(const dep of changed){if(dep.startsWith('vars.'))addMatchingDependencies(prepared.dependencyGraph.variableToNodes,dep,dirty);else if(dep.startsWith('context.'))addMatchingDependencies(prepared.dependencyGraph.contextToNodes,dep,dirty);else if(dep.startsWith('input.'))addMatchingDependencies(prepared.dependencyGraph.inputToNodes,dep,dirty);}
  const previousOverrides=cache.runtimeOverrides??{};const overrideKeys=new Set([...Object.keys(previousOverrides),...Object.keys(overrides)]);for(const key of overrideKeys)if(semanticHash(previousOverrides[key])!==semanticHash(overrides[key])){changed.push(`override.${key}`);dirty.add(key.split('.')[0]!);}
  if(changed.some(x=>x==='context.width'||x==='context.height'||x==='context.aspect'))for(const id of prepared.dependencyGraph.layoutDependentNodes)dirty.add(id);
  expandDirty(prepared,dirty);return{dirty,changed:[...new Set(changed)].sort()};
}

export function evaluateAt(request:VSREvaluateRequest):VSREvaluateResult {
  const started=performance.now(); const prepared='nodeById'in request.document?request.document:prepareDocument(request.document);
  const doc=prepared.document; const time=Math.max(0,Math.min(doc.metadata.duration,request.time)); const context=defaultContext(doc,request.context); const frame=Math.round(time*context.fps);
  const diagnostics=[...prepared.diagnostics];
  const initial:VSRState={variables:deepClone({...doc.variables,...request.initialState?.variables}),interaction:deepClone(request.initialState?.interaction??{}),runtime:deepClone(request.initialState?.runtime??{})};
  const allEvents=[...prepared.eventsSorted,...(request.events??[])]; const state=reduceEvents(initial,allEvents,time,diagnostics);const overrides=request.runtimeOverrides??{};
  const {dirty,changed}=calculateDirtyNodes(prepared,request.incrementalCache,time,context,state,overrides);
  const resolvedById=new Map<string,Record<string,unknown>>();let resolvedNodeCount=0,reusedResolvedNodeCount=0;
  for(const node of prepared.nodes){const cached=request.incrementalCache?.resolvedById.get(node.id);if(cached&&!dirty.has(node.id)){resolvedById.set(node.id,cached);reusedResolvedNodeCount++;}else{resolvedById.set(node.id,resolveNode(node,state,context,time,frame,doc.metadata.seed,overrides,diagnostics));resolvedNodeCount++;}}

  const projectionById=request.incrementalCache?.projectionById??new Map<string,VSRProjectionSnapshot>();
  const projectionDirty=new Set<string>(dirty);
  for(const id of dirty){let parent=prepared.parentByNode.get(id)??null;while(parent){projectionDirty.add(parent);parent=prepared.parentByNode.get(parent)??null;}}
  let projectedNodeCount=0,reusedProjectionNodeCount=0,skippedProjectionSubtreeCount=0,skippedProjectionNodeCount=0;
  const canvasBounds:VSRRect={x:0,y:0,width:context.width,height:context.height};
  const projectNode=(node:VSRPreparedNode,parentBounds:VSRRect,parentMatrix:VSRMatrix3,parentOpacity:number,parentClips:VSRClip[]):void=>{
    const cached=projectionById.get(node.id);
    if(cached&&!projectionDirty.has(node.id)){
      skippedProjectionSubtreeCount++;
      skippedProjectionNodeCount+=1+(prepared.dependencyGraph.descendantsByNode.get(node.id)?.size??0);
      return;
    }
    let snapshot:VSRProjectionSnapshot;
    if(cached&&!dirty.has(node.id)){
      snapshot=cached;
      reusedProjectionNodeCount++;
    }else{
      const resolved=resolvedById.get(node.id)!;const activeVisible=active(resolved,time)&&visible(resolved);
      if(!activeVisible){
        snapshot={activeVisible:false,localBounds:{x:0,y:0,width:0,height:0},worldTransform:identity,opacity:0,clipStack:[]};
      }else{
        const bounds=localBounds(resolved,parentBounds,context);const world=multiply(parentMatrix,nodeMatrix(resolved,bounds));const appearance=(resolved.appearance??{}) as Record<string,unknown>;const opacity=parentOpacity*Math.max(0,Math.min(1,Number(appearance.opacity??1)));
        const clips=[...parentClips];if(node.type==='group'&&Boolean((resolved.content as Record<string,unknown>|undefined)?.clip))clips.push({kind:'rect',nodeId:node.id,worldBounds:transformBounds(world,bounds)});
        const item=node.type==='group'?undefined:{id:node.id,nodeId:node.id,type:node.type,orderKey:nodeOrderKey(node),worldTransform:world,localBounds:bounds,worldBounds:transformBounds(world,bounds),opacity,appearance:{...(appearance as object),opacity} as VSRDisplayItem['appearance'],content:contentRecord(resolved),parentId:node.parentId,tags:node.tags,sourceTrace:resolved.__sourceTrace as Record<string,string>,clipStack:clips};
        snapshot={activeVisible:true,localBounds:bounds,worldTransform:world,opacity,clipStack:clips,item,itemHash:item?semanticHash(item):undefined};
      }
      projectedNodeCount++;
      projectionById.set(node.id,snapshot);
    }
    if(!snapshot.activeVisible){
      for(const descendant of prepared.dependencyGraph.descendantsByNode.get(node.id)??[])projectionById.delete(descendant);
      return;
    }
    for(const child of prepared.childrenByParent.get(node.id)??[])projectNode(child,snapshot.localBounds,snapshot.worldTransform,snapshot.opacity,snapshot.clipStack);
  };
  for(const root of prepared.childrenByParent.get(null)??[])projectNode(root,canvasBounds,identity,1,[]);

  const items:VSRDisplayItem[]=[];const itemHashes:string[]=[];let reusedDisplayItemCount=0;
  for(const node of prepared.displayOrderNodes){const snapshot=projectionById.get(node.id);if(snapshot?.activeVisible&&snapshot.item&&snapshot.itemHash){items.push(snapshot.item);itemHashes.push(snapshot.itemHash);if(!dirty.has(node.id))reusedDisplayItemCount++;}}
  const displayBase={documentId:doc.metadata.id,documentHash:prepared.documentHash,runtimeVersion:VSR_RUNTIME_VERSION,time,frame,viewport:{width:context.width,height:context.height,dpr:context.dpr},background:doc.canvas.background,items,diagnostics};
  const displayHash=semanticHash({documentId:displayBase.documentId,documentHash:displayBase.documentHash,runtimeVersion:displayBase.runtimeVersion,time,frame,viewport:displayBase.viewport,background:displayBase.background,itemHashes,hashMode:'item-manifest-v1'}); const displayState:VSRDisplayState={...displayBase,semanticHash:displayHash};
  if(request.incrementalCache){request.incrementalCache.documentHash=prepared.documentHash;request.incrementalCache.time=time;request.incrementalCache.context=deepClone(context);request.incrementalCache.state=deepClone(state);request.incrementalCache.runtimeOverrides=deepClone(overrides);request.incrementalCache.resolvedById=resolvedById;request.incrementalCache.projectionById=projectionById;}
  return {state,displayState,diagnostics,semanticHash:displayHash,evaluationStats:{durationMs:performance.now()-started,nodeCount:prepared.nodes.length,visibleItemCount:items.length,eventCount:allEvents.filter(e=>e.time<=time).length,resolvedNodeCount,reusedResolvedNodeCount,dirtyNodeCount:dirty.size,changedDependencies:changed,projectedNodeCount,reusedProjectionNodeCount,skippedProjectionSubtreeCount,skippedProjectionNodeCount,reusedDisplayItemCount,displayHashMode:'item-manifest-v1'}};
}

export class VSRClock {
  private _time=0; private _rate=1; private _status:'playing'|'paused'|'stopped'='stopped'; private listeners=new Set<(clock:VSRClock)=>void>();
  constructor(readonly duration:number,readonly fps:number){}
  get time(){return this._time} get rate(){return this._rate} get status(){return this._status}
  play(){this._status='playing';this.emit()} pause(){this._status='paused';this.emit()} stop(){this._status='stopped';this._time=0;this.emit()}
  seek(time:number){this._time=Math.max(0,Math.min(this.duration,time));this.emit()} step(frames:number){this.seek(this._time+frames/this.fps)} setRate(rate:number){if(!Number.isFinite(rate)||rate===0)throw new Error('Clock rate must be finite and non-zero.');this._rate=rate;this.emit()}
  tick(deltaSeconds:number){if(this._status!=='playing')return;this.seek(this._time+deltaSeconds*this._rate);if(this._time>=this.duration)this.pause()}
  subscribe(listener:(clock:VSRClock)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener)} private emit(){for(const listener of this.listeners)listener(this)}
}

export class VSRRuntimeSession {
  readonly prepared:VSRPreparedDocument; readonly clock:VSRClock;
  private context:Partial<VSRContext>; private overrides:Record<string,VSRValue>={}; private cache=createIncrementalCache();
  private liveState:Partial<VSRState>={variables:{},interaction:{},runtime:{}}; private liveEvents:VSREvent[]=[];
  constructor(document:VSRDocument,context:Partial<VSRContext>={}){this.prepared=prepareDocument(document);this.context=context;this.clock=new VSRClock(document.metadata.duration,context.fps??document.metadata.defaultFps)}
  evaluate(time=this.clock.time){return evaluateAt({document:this.prepared,time,context:this.context,initialState:this.liveState,events:this.liveEvents,runtimeOverrides:this.overrides,incrementalCache:this.cache})}
  setInput(input:NonNullable<VSRContext['input']>){this.context={...this.context,input:{...this.context.input,...deepClone(input)}}}
  setContext(context:Partial<VSRContext>){this.context={...this.context,...deepClone(context),input:{...this.context.input,...context.input}}}
  setVariables(variables:Record<string,VSRValue>){this.liveState={...this.liveState,variables:{...(this.liveState.variables??{}),...deepClone(variables)}}}
  replaceVariables(variables:Record<string,VSRValue>){this.liveState={...this.liveState,variables:deepClone(variables)}}
  getVariables(){return deepClone(this.liveState.variables??{})}
  getInteractionState(){return deepClone(this.liveState.interaction??{})}
  replaceInteractionState(interaction:Record<string,VSRValue>){this.liveState={...this.liveState,interaction:deepClone(interaction)}}
  getRuntimeState(){return deepClone(this.liveState.runtime??{})}
  getRuntimeOverrides(){return deepClone(this.overrides)}
  getContext(){return deepClone(this.context)}
  setInteractionState(interaction:Record<string,VSRValue>){this.liveState={...this.liveState,interaction:{...(this.liveState.interaction??{}),...deepClone(interaction)}}}
  dispatchEvent(event:VSREvent){this.liveEvents.push(deepClone(event))}
  replaceEvents(events:VSREvent[]){this.liveEvents=deepClone(events)}
  clearEvents(){this.liveEvents=[]}
  setRuntimeOverrides(overrides:Record<string,VSRValue>){this.overrides={...this.overrides,...deepClone(overrides)}}
  replaceRuntimeOverrides(overrides:Record<string,VSRValue>){this.overrides=deepClone(overrides)}
  invalidate(){this.cache=createIncrementalCache()}
  dependencyReport(){const g=this.prepared.dependencyGraph;const map=(m:Map<string,Set<string>>)=>Object.fromEntries([...m].map(([k,v])=>[k,[...v].sort()]));return{variables:map(g.variableToNodes),context:map(g.contextToNodes),input:map(g.inputToNodes),timeDependent:[...g.timeDependentNodes].sort(),layoutDependent:[...g.layoutDependentNodes].sort()}}
  dispose(){this.clock.stop();this.invalidate();this.liveEvents=[]}
}

export const matrix = { identity, multiply, translation, scaling, rotation, applyMatrix, transformBounds };
