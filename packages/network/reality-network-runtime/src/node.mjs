import {AtomicJsonStore} from '@taowind/rncs-durable-store';
import {clone, hash} from './protocol.mjs';
import {verifyNetworkSessionCheckpoint} from './server.mjs';

export const NETWORK_CHECKPOINT_STORE_RECEIPT_FORMAT='rncs.network-checkpoint-store-receipt.v0.1';

function checkpointStoreReceipt(input){
  const base={
    format:NETWORK_CHECKPOINT_STORE_RECEIPT_FORMAT,version:'0.1.0',operation:input.operation,status:input.status,source:input.source,
    checkpointRoot:input.valueRoot,bytes:input.bytes,atomicRename:input.atomicRename,fileSynced:input.fileSynced,directorySynced:input.directorySynced,
    canonicalStateMutated:false,authority:{providerCanWriteAuthoritativeWorldState:false,rncsAuthorityRequired:true},candidateOnly:true,authoritative:false,commitStatus:'NOT_COMMITTED'
  };
  return{...base,receiptRoot:hash(base)};
}

export function verifyNetworkCheckpointStoreReceipt(receipt){
  const errors=[],check=(condition,code)=>{if(!condition)errors.push(code)};
  if(!receipt||typeof receipt!=='object')return{valid:false,errors:['NETWORK_CHECKPOINT_STORE_RECEIPT_NOT_OBJECT']};
  try{
    const copy=clone(receipt),root=copy.receiptRoot;delete copy.receiptRoot;
    check(receipt.format===NETWORK_CHECKPOINT_STORE_RECEIPT_FORMAT,'NETWORK_CHECKPOINT_STORE_RECEIPT_FORMAT_INVALID');
    check(receipt.version==='0.1.0','NETWORK_CHECKPOINT_STORE_RECEIPT_VERSION_INVALID');
    check(['SAVE','RECOVER'].includes(receipt.operation),'NETWORK_CHECKPOINT_STORE_RECEIPT_OPERATION_INVALID');
    check(['COMMITTED','RECOVERED'].includes(receipt.status),'NETWORK_CHECKPOINT_STORE_RECEIPT_STATUS_INVALID');
    check(['temp_rename','primary','temporary_promoted'].includes(receipt.source),'NETWORK_CHECKPOINT_STORE_RECEIPT_SOURCE_INVALID');
    check(typeof receipt.checkpointRoot==='string'&&receipt.checkpointRoot.length>0,'NETWORK_CHECKPOINT_STORE_RECEIPT_ROOT_INVALID');
    check(Number.isSafeInteger(receipt.bytes)&&receipt.bytes>0,'NETWORK_CHECKPOINT_STORE_RECEIPT_BYTES_INVALID');
    check(receipt.atomicRename===true&&receipt.fileSynced===true&&typeof receipt.directorySynced==='boolean','NETWORK_CHECKPOINT_STORE_RECEIPT_ATOMICITY_INVALID');
    check(receipt.canonicalStateMutated===false,'NETWORK_CHECKPOINT_STORE_RECEIPT_CANONICAL_MUTATION');
    check(receipt.authority?.providerCanWriteAuthoritativeWorldState===false,'NETWORK_CHECKPOINT_STORE_RECEIPT_AUTHORITY_ESCALATION');
    check(receipt.candidateOnly===true&&receipt.authoritative===false&&receipt.commitStatus==='NOT_COMMITTED','NETWORK_CHECKPOINT_STORE_RECEIPT_AUTHORITY_SCOPE_INVALID');
    check(typeof root==='string'&&root===hash(copy),'NETWORK_CHECKPOINT_STORE_RECEIPT_ROOT_MISMATCH');
  }catch(error){errors.push(`NETWORK_CHECKPOINT_STORE_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`)}
  return{valid:errors.length===0,errors,receiptRoot:receipt.receiptRoot??null};
}

export class NetworkSessionCheckpointStore {
  constructor({filePath,path:pathValue}={}){
    this.store=new AtomicJsonStore({filePath:pathValue??filePath,verify:verifyNetworkSessionCheckpoint,valueRoot:checkpoint=>checkpoint.checkpointRoot,codePrefix:'NETWORK_CHECKPOINT_STORE'});
    this.filePath=this.store.filePath;this.tempPath=this.store.tempPath;
  }
  async save(checkpoint,{faultAt}={}){return checkpointStoreReceipt(await this.store.save(checkpoint,{faultAt}));}
  async load(){return this.store.load();}
  async recover(){
    const result=await this.store.recover();
    return{status:result.status,source:result.source,checkpoint:result.value?clone(result.value):null,receipt:result.receipt?checkpointStoreReceipt(result.receipt):null,diagnostics:result.diagnostics};
  }
}
