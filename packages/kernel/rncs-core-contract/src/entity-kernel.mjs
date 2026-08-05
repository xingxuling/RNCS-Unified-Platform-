import {ContractError,rootHash,without} from './index.mjs';

export const ENTITY_KERNEL_FORMAT='rncs.entity-kernel.v0.1';
export const FRAGMENT_SCHEMA_FORMAT='rncs.fragment-schema.v0.1';
export const ENTITY_COMPOSITION_FORMAT='rncs.entity-composition.v0.1';
export const ENTITY_STATE_BATCH_FORMAT='rncs.entity-state-batch.v0.1';
export const DEFERRED_MUTATION_FORMAT='rncs.deferred-mutation.v0.1';
export const ENTITY_KERNEL_SNAPSHOT_FORMAT='rncs.entity-kernel.snapshot.v0.1';

const TYPES=new Set(['integer','decimal','boolean','string','json']);
const AUTHORITY_RANK={read:0,candidate:1,simulation:2,authority:3};
const DECIMAL=/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const clone=value=>structuredClone(value);
const keySort=(a,b)=>Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8'));
const fail=(condition,code,detail='')=>{if(!condition)throw new ContractError(`${code}${detail?`:${detail}`:''}`);};
const strings=value=>[...new Set((Array.isArray(value)?value:[]).map(String))].sort(keySort);
const hex64=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);

function validateValue(value,spec,path){
  const type=spec.type;
  if(type==='integer')fail(Number.isSafeInteger(value),'FRAGMENT_VALUE_INVALID',`${path}:integer`);
  else if(type==='decimal')fail(typeof value==='string'&&DECIMAL.test(value),'FRAGMENT_VALUE_INVALID',`${path}:decimal`);
  else if(type==='boolean')fail(typeof value==='boolean','FRAGMENT_VALUE_INVALID',`${path}:boolean`);
  else if(type==='string')fail(typeof value==='string','FRAGMENT_VALUE_INVALID',`${path}:string`);
  else if(type==='json'){try{rootHash(value);}catch(error){throw new ContractError(`FRAGMENT_VALUE_INVALID:${path}:json:${error.message}`);}}
  return clone(value);
}

function normalizeSchema(input={}){
  const fragmentId=String(input.fragment_id??input.fragmentId??'');
  fail(fragmentId,'FRAGMENT_ID_REQUIRED');
  const version=String(input.version??'0.1.0');
  const rawFields=input.fields??{};
  fail(rawFields&&typeof rawFields==='object'&&!Array.isArray(rawFields),'FRAGMENT_FIELDS_INVALID',fragmentId);
  const fields={};
  for(const fieldId of Object.keys(rawFields).sort(keySort)){
    const raw=rawFields[fieldId]??{};
    const type=String(raw.type??'json');
    fail(TYPES.has(type),'FRAGMENT_FIELD_TYPE_INVALID',`${fragmentId}.${fieldId}`);
    const field={type};
    if(own(raw,'default'))field.default=validateValue(raw.default,field,`${fragmentId}.${fieldId}.default`);
    fields[fieldId]=field;
  }
  const schema={format:FRAGMENT_SCHEMA_FORMAT,version,fragment_id:fragmentId,fields};
  const fragmentRoot=rootHash(schema);
  if(input.fragment_root!==undefined)fail(input.fragment_root===fragmentRoot,'FRAGMENT_ROOT_MISMATCH',fragmentId);
  return{...schema,fragment_root:fragmentRoot};
}

function valuesFor(schema,values={}){
  fail(values&&typeof values==='object'&&!Array.isArray(values),'FRAGMENT_VALUES_INVALID',schema.fragment_id);
  for(const fieldId of Object.keys(values))fail(own(schema.fields,fieldId),'FRAGMENT_FIELD_UNKNOWN',`${schema.fragment_id}.${fieldId}`);
  const result={};
  for(const [fieldId,spec] of Object.entries(schema.fields)){
    if(own(values,fieldId))result[fieldId]=validateValue(values[fieldId],spec,`${schema.fragment_id}.${fieldId}`);
    else if(own(spec,'default'))result[fieldId]=clone(spec.default);
    else throw new ContractError(`FRAGMENT_FIELD_REQUIRED:${schema.fragment_id}.${fieldId}`);
  }
  return result;
}

function compositionFor(schemas,fragmentIds){
  const fragmentRefs=fragmentIds.map(fragmentId=>({fragment_id:fragmentId,fragment_root:schemas.get(fragmentId).fragment_root}));
  const composition={format:ENTITY_COMPOSITION_FORMAT,version:'0.1.0',fragment_ids:fragmentIds,fragment_refs:fragmentRefs};
  return{...composition,composition_root:rootHash(composition)};
}

function entityRoot(entity){return rootHash(without(entity,'entity_root'));}

function normalizedEntity(schemas,{entity_id,entityId,tags=[],fragments={}}={}){
  const id=String(entity_id??entityId??'');
  fail(id,'ENTITY_ID_REQUIRED');
  fail(fragments&&typeof fragments==='object'&&!Array.isArray(fragments),'ENTITY_FRAGMENTS_INVALID',id);
  const fragmentIds=Object.keys(fragments).sort(keySort);
  fail(fragmentIds.length>0,'ENTITY_EMPTY_COMPOSITION',id);
  const normalizedFragments={};
  for(const fragmentId of fragmentIds){
    const schema=schemas.get(fragmentId);
    fail(schema,'FRAGMENT_SCHEMA_UNKNOWN',fragmentId);
    normalizedFragments[fragmentId]=valuesFor(schema,fragments[fragmentId]);
  }
  const entity={entity_id:id,tags:strings(tags),fragments:normalizedFragments,composition:compositionFor(schemas,fragmentIds)};
  return{...entity,entity_root:entityRoot(entity)};
}

function sortedEntities(entities){return[...entities.values()].sort((a,b)=>keySort(a.entity_id,b.entity_id)).map(clone);}

export function verifyEntityStateBatch(batch){
  if(batch?.format!==ENTITY_STATE_BATCH_FORMAT||typeof batch?.batch_root!=='string')return false;
  try{return rootHash(without(batch,'batch_root'))===batch.batch_root}catch{return false}
}

export class EntityKernel{
  constructor({world_id,worldId='world:default',generation=0,generation_root,generationRoot='0'.repeat(64),tick=0,max_mutations=10000,maxMutations=10000}={}){
    this.world_id=String(world_id??worldId);
    this.generation=Number(generation);
    this.generation_root=String(generation_root??generationRoot);
    this.tick=Number(tick);
    this.max_mutations=Number(max_mutations??maxMutations);
    fail(this.world_id,'WORLD_ID_REQUIRED');
    fail(Number.isSafeInteger(this.generation)&&this.generation>=0,'GENERATION_INVALID');
    fail(hex64(this.generation_root),'GENERATION_ROOT_INVALID');
    fail(Number.isSafeInteger(this.tick)&&this.tick>=0,'TICK_INVALID');
    fail(Number.isSafeInteger(this.max_mutations)&&this.max_mutations>0,'MUTATION_BUDGET_INVALID');
    this.schemas=new Map();
    this.entities=new Map();
    this.ledger=[];
    this.sequence=0;
  }
  registerFragment(input){
    const schema=normalizeSchema(input);
    fail(!this.schemas.has(schema.fragment_id),'FRAGMENT_SCHEMA_DUPLICATE',schema.fragment_id);
    this.schemas.set(schema.fragment_id,schema);
    return clone(schema);
  }
  registerEntity(input){
    const entity=normalizedEntity(this.schemas,input);
    fail(!this.entities.has(entity.entity_id),'ENTITY_DUPLICATE',entity.entity_id);
    this.entities.set(entity.entity_id,entity);
    return clone(entity);
  }
  getEntity(entityId){const entity=this.entities.get(String(entityId));return entity?clone(entity):null;}
  fragmentSchema(fragmentId){const schema=this.schemas.get(String(fragmentId));return schema?clone(schema):null;}
  stateRoot(){
    return rootHash({format:ENTITY_KERNEL_FORMAT,version:'0.1.0',world_id:this.world_id,generation:this.generation,generation_root:this.generation_root,tick:this.tick,schemas:[...this.schemas.values()].sort((a,b)=>keySort(a.fragment_id,b.fragment_id)),entities:sortedEntities(this.entities)});
  }
  ledgerRoot(){return rootHash({format:DEFERRED_MUTATION_FORMAT,version:'0.1.0',mutations:this.ledger.map(clone)});}
  pendingMutations(){return this.ledger.map(clone);}
  readStateBatch({entity_ids,entityIds,fragment_ids,fragmentIds,tags=[]}={}){
    const requestedEntities=strings(entity_ids??entityIds);
    const requestedFragments=strings(fragment_ids??fragmentIds);
    for(const fragmentId of requestedFragments)fail(this.schemas.has(fragmentId),'FRAGMENT_SCHEMA_UNKNOWN',fragmentId);
    const tagFilter=new Set(strings(tags));
    const ids=requestedEntities.length?requestedEntities:[...this.entities.keys()].sort(keySort);
    const rows=[];
    for(const id of ids){
      const entity=this.entities.get(id);
      if(!entity)continue;
      if(tagFilter.size&&!([...tagFilter].every(tag=>entity.tags.includes(tag))))continue;
      const selected=requestedFragments.length?requestedFragments:Object.keys(entity.fragments).sort(keySort);
      const fragments={};
      for(const fragmentId of selected)if(own(entity.fragments,fragmentId))fragments[fragmentId]=clone(entity.fragments[fragmentId]);
      rows.push({entity_id:entity.entity_id,tags:clone(entity.tags),fragments,composition:clone(entity.composition),entity_root:entity.entity_root});
    }
    const batch={format:ENTITY_STATE_BATCH_FORMAT,version:'0.1.0',world_id:this.world_id,generation:this.generation,generation_root:this.generation_root,tick:this.tick,state_root:this.stateRoot(),entity_ids:rows.map(row=>row.entity_id),fragment_ids:requestedFragments.length?requestedFragments:[...new Set(rows.flatMap(row=>Object.keys(row.fragments)))].sort(keySort),rows};
    return{...batch,batch_root:rootHash(batch)};
  }
  deferMutation({entity_id,entityId,fragment_id,fragmentId,field,operation='set',value,source='scheduler',authority='simulation',expected_entity_root,expectedEntityRoot,tick=this.tick}={}){
    const id=String(entity_id??entityId??''),fid=String(fragment_id??fragmentId??''),fieldId=String(field??'');
    const entity=this.entities.get(id),schema=this.schemas.get(fid);
    fail(entity,'ENTITY_UNKNOWN',id);fail(schema,'FRAGMENT_SCHEMA_UNKNOWN',fid);fail(own(schema.fields,fieldId),'FRAGMENT_FIELD_UNKNOWN',`${fid}.${fieldId}`);
    fail(Object.hasOwn(AUTHORITY_RANK,authority),'AUTHORITY_INVALID',authority);
    fail(['set','add'].includes(operation),'MUTATION_OPERATION_INVALID',operation);
    fail(Number.isSafeInteger(tick)&&tick>=this.tick,'MUTATION_TICK_INVALID');
    const spec=schema.fields[fieldId];
    if(operation==='add')fail(spec.type==='integer'&&Number.isSafeInteger(value),'MUTATION_ADD_TYPE_INVALID',`${fid}.${fieldId}`);
    else validateValue(value,spec,`${fid}.${fieldId}`);
    const expected=expected_entity_root??expectedEntityRoot;
    if(expected!==undefined)fail(hex64(expected),'EXPECTED_ENTITY_ROOT_INVALID');
    const sequence=this.sequence+1;
    const mutation={format:DEFERRED_MUTATION_FORMAT,version:'0.1.0',mutation_id:`mutation:${this.world_id}:${tick}:${sequence}`,sequence,tick:Number(tick),entity_id:id,fragment_id:fid,field:fieldId,operation,source:String(source),authority,value:clone(value)};
    if(expected!==undefined)mutation.expected_entity_root=String(expected);
    this.sequence=sequence;
    this.ledger.push(mutation);
    return clone(mutation);
  }
  commitMutations({tick=this.tick,authority='simulation',max_mutations,maxMutations}={}){
    fail(Object.hasOwn(AUTHORITY_RANK,authority),'AUTHORITY_INVALID',authority);
    fail(Number.isSafeInteger(tick)&&tick>=this.tick,'COMMIT_TICK_INVALID');
    const budget=Number(max_mutations??maxMutations??this.max_mutations);
    fail(Number.isSafeInteger(budget)&&budget>0,'MUTATION_BUDGET_INVALID');
    fail(this.ledger.length<=budget,'MUTATION_BUDGET_EXCEEDED');
    const baseStateRoot=this.stateRoot();
    const working=new Map([...this.entities.entries()].map(([id,entity])=>[id,clone(entity)]));
    const mutations=this.ledger.map(clone).sort((a,b)=>a.sequence-b.sequence||keySort(a.mutation_id,b.mutation_id));
    for(const mutation of mutations){
      fail(AUTHORITY_RANK[authority]>=AUTHORITY_RANK[mutation.authority],'MUTATION_AUTHORITY_INSUFFICIENT',mutation.mutation_id);
      const entity=working.get(mutation.entity_id),schema=this.schemas.get(mutation.fragment_id);
      fail(entity,'ENTITY_UNKNOWN',mutation.entity_id);fail(schema,'FRAGMENT_SCHEMA_UNKNOWN',mutation.fragment_id);
      if(mutation.expected_entity_root!==undefined)fail(entity.entity_root===mutation.expected_entity_root,'MUTATION_EXPECTED_ROOT_MISMATCH',mutation.mutation_id);
      const spec=schema.fields[mutation.field],fragment=entity.fragments[mutation.fragment_id];
      let next;
      if(mutation.operation==='set')next=validateValue(mutation.value,spec,`${mutation.fragment_id}.${mutation.field}`);
      else{const current=fragment[mutation.field];next=current+mutation.value;validateValue(next,spec,`${mutation.fragment_id}.${mutation.field}`);}
      fragment[mutation.field]=next;
      entity.entity_root=entityRoot(entity);
    }
    const mutationRoot=rootHash(mutations);
    this.entities=working;
    this.tick=Number(tick);
    this.ledger=[];
    const batch={format:ENTITY_STATE_BATCH_FORMAT,version:'0.1.0',world_id:this.world_id,generation:this.generation,generation_root:this.generation_root,tick:this.tick,base_state_root:baseStateRoot,state_root:this.stateRoot(),mutation_root:mutationRoot,mutations,entities:sortedEntities(this.entities)};
    return{...batch,batch_root:rootHash(batch)};
  }
  snapshot(){
    const snapshot={format:ENTITY_KERNEL_SNAPSHOT_FORMAT,version:'0.1.0',world_id:this.world_id,generation:this.generation,generation_root:this.generation_root,tick:this.tick,max_mutations:this.max_mutations,sequence:this.sequence,schemas:[...this.schemas.values()].sort((a,b)=>keySort(a.fragment_id,b.fragment_id)),entities:sortedEntities(this.entities),pending_mutations:this.pendingMutations()};
    return{...snapshot,snapshot_root:rootHash(snapshot)};
  }
  restore(snapshot){
    fail(snapshot?.format===ENTITY_KERNEL_SNAPSHOT_FORMAT,'SNAPSHOT_FORMAT_INVALID');
    fail(rootHash(without(snapshot,'snapshot_root'))===snapshot.snapshot_root,'SNAPSHOT_ROOT_MISMATCH');
    this.world_id=snapshot.world_id;this.generation=snapshot.generation;this.generation_root=snapshot.generation_root;this.tick=snapshot.tick;this.max_mutations=snapshot.max_mutations;this.sequence=snapshot.sequence;
    this.schemas=new Map((snapshot.schemas??[]).map(schema=>[schema.fragment_id,clone(schema)]));
    this.entities=new Map((snapshot.entities??[]).map(entity=>[entity.entity_id,clone(entity)]));
    this.ledger=(snapshot.pending_mutations??[]).map(clone);
    return this.stateRoot();
  }
}
