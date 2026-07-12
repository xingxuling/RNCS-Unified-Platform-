import { deepClone, documentHash, validateDocument, type VSRDiagnostic, type VSRDocument, type VSREvent, type VSRKeyframe, type VSRNode, type VSROutputProfile, type VSRTrack, type VSRValue, type VSRValidationReport } from '../../spec/src/index.js';

export interface VSRPrecondition { path?:string; equals?:unknown; nodeExists?:string; nodeMissing?:string }
export type VSROperation =
  | {type:'addNode';node:VSRNode}
  | {type:'removeNode';nodeId:string;cascade?:boolean}
  | {type:'updateNode';nodeId:string;path:string;value:unknown}
  | {type:'moveNode';nodeId:string;parentId?:string;order?:number}
  | {type:'duplicateNode';nodeId:string;newNodeId:string}
  | {type:'addTrack';nodeId:string;track:VSRTrack}
  | {type:'updateTrack';nodeId:string;trackId:string;patch:Partial<VSRTrack>}
  | {type:'removeTrack';nodeId:string;trackId:string}
  | {type:'addKeyframe';nodeId:string;trackId:string;keyframe:VSRKeyframe}
  | {type:'updateKeyframe';nodeId:string;trackId:string;keyframeId:string;patch:Partial<VSRKeyframe>}
  | {type:'removeKeyframe';nodeId:string;trackId:string;keyframeId:string}
  | {type:'setVariable';name:string;value:VSRValue}
  | {type:'addEvent';event:VSREvent}
  | {type:'removeEvent';eventId:string}
  | {type:'setOutputProfile';profile:VSROutputProfile}
  | {type:'replaceDocument';document:VSRDocument};
export interface VSRTransaction { transactionId:string;baseDocumentHash?:string;operations:VSROperation[];preconditions?:VSRPrecondition[];metadata?:{actorId?:string;reason?:string;createdAt?:string} }
export interface VSRDiffEntry {path:string;before?:unknown;after?:unknown;nodeId?:string;classification:'added'|'removed'|'changed'}
export interface VSRDocumentDiff {added:VSRDiffEntry[];removed:VSRDiffEntry[];changed:VSRDiffEntry[]}
export interface VSRTransactionResult {ok:boolean;transactionId:string;documentHashBefore:string;documentHashAfter?:string;document?:VSRDocument;affectedNodeIds:string[];diff:VSRDocumentDiff;inverseTransaction?:VSRTransaction;validation:VSRValidationReport;warnings:VSRDiagnostic[];error?:string}

function getPath(target:unknown,path:string):unknown{let cursor=target;for(const part of path.split('.').filter(Boolean)){if(cursor===null||typeof cursor!=='object'||!Object.prototype.hasOwnProperty.call(cursor,part))return undefined;cursor=(cursor as Record<string,unknown>)[part]}return cursor}
function setPath(target:Record<string,unknown>,path:string,value:unknown):void{const parts=path.split('.').filter(Boolean);if(!parts.length)throw new Error('Path cannot be empty.');if(parts.some(p=>['__proto__','prototype','constructor'].includes(p)))throw new Error('Forbidden path.');let cursor=target;for(let i=0;i<parts.length-1;i++){const key=parts[i]!;if(!cursor[key]||typeof cursor[key]!=='object'||Array.isArray(cursor[key]))cursor[key]={};cursor=cursor[key] as Record<string,unknown>}cursor[parts.at(-1)!]=deepClone(value)}
function node(doc:VSRDocument,id:string):VSRNode{const found=doc.nodes.find(n=>n.id===id);if(!found)throw new Error(`Node not found: ${id}`);return found}
function track(doc:VSRDocument,nodeId:string,trackId:string):VSRTrack{const found=node(doc,nodeId).tracks?.find(t=>t.id===trackId);if(!found)throw new Error(`Track not found: ${trackId}`);return found}
function affected(op:VSROperation):string[]{if('nodeId'in op)return[op.nodeId];if(op.type==='addNode')return[op.node.id];return[]}

function applyOperation(doc:VSRDocument,op:VSROperation):VSRDocument{
  if(op.type==='replaceDocument')return deepClone(op.document);
  if(op.type==='addNode'){if(doc.nodes.some(n=>n.id===op.node.id))throw new Error(`Node already exists: ${op.node.id}`);doc.nodes.push(deepClone(op.node));return doc}
  if(op.type==='removeNode'){node(doc,op.nodeId);const children=doc.nodes.filter(n=>n.parentId===op.nodeId);if(children.length&&!op.cascade)throw new Error(`Node ${op.nodeId} has children; cascade is required.`);const remove=new Set([op.nodeId]);if(op.cascade){let changed=true;while(changed){changed=false;for(const n of doc.nodes)if(n.parentId&&remove.has(n.parentId)&&!remove.has(n.id)){remove.add(n.id);changed=true}}}doc.nodes=doc.nodes.filter(n=>!remove.has(n.id));return doc}
  if(op.type==='updateNode'){const n=node(doc,op.nodeId) as unknown as Record<string,unknown>;setPath(n,op.path,op.value);return doc}
  if(op.type==='moveNode'){const n=node(doc,op.nodeId);if(op.parentId===op.nodeId)throw new Error('Node cannot parent itself.');if(op.parentId)node(doc,op.parentId);n.parentId=op.parentId;n.order=op.order??n.order;return doc}
  if(op.type==='duplicateNode'){const source=deepClone(node(doc,op.nodeId));if(doc.nodes.some(n=>n.id===op.newNodeId))throw new Error(`Node already exists: ${op.newNodeId}`);source.id=op.newNodeId;source.name=`${source.name??source.id} 副本`;doc.nodes.push(source);return doc}
  if(op.type==='addTrack'){const n=node(doc,op.nodeId);n.tracks??=[];if(n.tracks.some(t=>t.id===op.track.id))throw new Error(`Track already exists: ${op.track.id}`);n.tracks.push(deepClone(op.track));return doc}
  if(op.type==='updateTrack'){Object.assign(track(doc,op.nodeId,op.trackId),deepClone(op.patch));return doc}
  if(op.type==='removeTrack'){const n=node(doc,op.nodeId);n.tracks=(n.tracks??[]).filter(t=>t.id!==op.trackId);return doc}
  if(op.type==='addKeyframe'){const t=track(doc,op.nodeId,op.trackId);t.keyframes??=[];if(t.keyframes.some(k=>k.id===op.keyframe.id))throw new Error(`Keyframe already exists: ${op.keyframe.id}`);t.keyframes.push(deepClone(op.keyframe));return doc}
  if(op.type==='updateKeyframe'){const k=track(doc,op.nodeId,op.trackId).keyframes?.find(k=>k.id===op.keyframeId);if(!k)throw new Error(`Keyframe not found: ${op.keyframeId}`);Object.assign(k,deepClone(op.patch));return doc}
  if(op.type==='removeKeyframe'){const t=track(doc,op.nodeId,op.trackId);t.keyframes=(t.keyframes??[]).filter(k=>k.id!==op.keyframeId);return doc}
  if(op.type==='setVariable'){doc.variables??={};doc.variables[op.name]=deepClone(op.value);return doc}
  if(op.type==='addEvent'){doc.events??=[];if(doc.events.some(e=>e.id===op.event.id))throw new Error(`Event already exists: ${op.event.id}`);doc.events.push(deepClone(op.event));return doc}
  if(op.type==='removeEvent'){doc.events=(doc.events??[]).filter(e=>e.id!==op.eventId);return doc}
  if(op.type==='setOutputProfile'){doc.outputs??=[];const index=doc.outputs.findIndex(p=>p.id===op.profile.id);if(index>=0)doc.outputs[index]=deepClone(op.profile);else doc.outputs.push(deepClone(op.profile));return doc}
  return doc;
}

function createDiff(before:unknown,after:unknown,path=''):VSRDocumentDiff{const result:VSRDocumentDiff={added:[],removed:[],changed:[]};const walk=(a:unknown,b:unknown,p:string)=>{if(Object.is(a,b))return;if(a===undefined){result.added.push({path:p,after:b,classification:'added'});return}if(b===undefined){result.removed.push({path:p,before:a,classification:'removed'});return}if(a&&b&&typeof a==='object'&&typeof b==='object'){if(Array.isArray(a)&&Array.isArray(b)){const max=Math.max(a.length,b.length);for(let i=0;i<max;i++)walk(a[i],b[i],`${p}/${i}`);return}if(!Array.isArray(a)&&!Array.isArray(b)){const keys=new Set([...Object.keys(a as object),...Object.keys(b as object)]);for(const key of[...keys].sort())walk((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key],`${p}/${key}`);return}}result.changed.push({path:p,before:a,after:b,classification:'changed'})};walk(before,after,path);return result}

function checkPreconditions(doc:VSRDocument,preconditions:VSRPrecondition[]=[]):void{for(const p of preconditions){if(p.nodeExists&&!doc.nodes.some(n=>n.id===p.nodeExists))throw new Error(`Precondition failed: node ${p.nodeExists} must exist.`);if(p.nodeMissing&&doc.nodes.some(n=>n.id===p.nodeMissing))throw new Error(`Precondition failed: node ${p.nodeMissing} must be absent.`);if(p.path!==undefined&&!Object.is(getPath(doc,p.path),p.equals))throw new Error(`Precondition failed at ${p.path}.`)}}

export function applyTransaction(document:VSRDocument,transaction:VSRTransaction):VSRTransactionResult{
  const before=deepClone(document),beforeHash=documentHash(before),affectedNodeIds=[...new Set(transaction.operations.flatMap(affected))];
  const empty:VSRDocumentDiff={added:[],removed:[],changed:[]};
  try{
    if(transaction.baseDocumentHash&&transaction.baseDocumentHash!==beforeHash)throw new Error(`Base document hash conflict: expected ${transaction.baseDocumentHash}, got ${beforeHash}.`);
    checkPreconditions(before,transaction.preconditions);let working=deepClone(before);for(const operation of transaction.operations)working=applyOperation(working,operation);
    const validation=validateDocument(working);if(!validation.ok)throw new Error(validation.diagnostics.filter(d=>d.severity==='error'||d.severity==='fatal').map(d=>d.message).join('; '));
    const afterHash=documentHash(working),diff=createDiff(before,working),inverseTransaction:VSRTransaction={transactionId:`undo:${transaction.transactionId}`,baseDocumentHash:afterHash,operations:[{type:'replaceDocument',document:before}],metadata:{actorId:'vsr-history',reason:`Undo ${transaction.transactionId}`}};
    return{ok:true,transactionId:transaction.transactionId,documentHashBefore:beforeHash,documentHashAfter:afterHash,document:working,affectedNodeIds,diff,inverseTransaction,validation,warnings:validation.diagnostics.filter(d=>d.severity==='warning'||d.severity==='info')};
  }catch(error){return{ok:false,transactionId:transaction.transactionId,documentHashBefore:beforeHash,affectedNodeIds,diff:empty,validation:validateDocument(before),warnings:[],error:error instanceof Error?error.message:String(error)}}
}

export class VSRHistory{
  private undoStack:Array<{forward:VSRTransaction;inverse:VSRTransaction}>=[];private redoStack:Array<{forward:VSRTransaction;inverse:VSRTransaction}>=[];
  apply(document:VSRDocument,transaction:VSRTransaction):VSRTransactionResult{const result=applyTransaction(document,transaction);if(result.ok&&result.inverseTransaction){this.undoStack.push({forward:transaction,inverse:result.inverseTransaction});this.redoStack=[]}return result}
  undo(document:VSRDocument):VSRTransactionResult|undefined{const item=this.undoStack.pop();if(!item)return undefined;const result=applyTransaction(document,{...item.inverse,baseDocumentHash:documentHash(document)});if(result.ok)this.redoStack.push(item);else this.undoStack.push(item);return result}
  redo(document:VSRDocument):VSRTransactionResult|undefined{const item=this.redoStack.pop();if(!item)return undefined;const result=applyTransaction(document,{...item.forward,baseDocumentHash:documentHash(document)});if(result.ok)this.undoStack.push(item);else this.redoStack.push(item);return result}
  get canUndo(){return this.undoStack.length>0}get canRedo(){return this.redoStack.length>0}clear(){this.undoStack=[];this.redoStack=[]}
}
