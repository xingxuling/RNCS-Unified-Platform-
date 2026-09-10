import {mkdir, open, readFile, rename} from 'node:fs/promises';
import {dirname, isAbsolute} from 'node:path';

const clone=value=>structuredClone(value);
const validResult=result=>result===true?{valid:true,errors:[]}:result&&typeof result==='object'?{valid:result.valid===true,errors:Array.isArray(result.errors)?result.errors.map(String):[]}:({valid:false,errors:['DURABLE_STORE_VERIFIER_INVALID']});

async function syncDirectory(directoryPath){
  let handle=null;
  try{
    handle=await open(directoryPath,'r');
    await handle.sync();
    return true;
  }catch(error){
    if(['EBADF','EISDIR','EINVAL','ENOTDIR','ENOTSUP','EPERM'].includes(error.code))return false;
    throw error;
  }finally{
    if(handle)await handle.close();
  }
}

function injectFault(codePrefix,faultAt,stage){
  if(faultAt===stage)throw new Error(`${codePrefix}_FAULT:${stage}`);
}

export class AtomicJsonStore {
  constructor({filePath,path:pathValue,verify=()=>({valid:true,errors:[]}),valueRoot=value=>value?.root??null,codePrefix='ATOMIC_JSON_STORE',invalidValueCode=`${codePrefix}_VALUE_INVALID`,primaryMissingCode=`${codePrefix}_PRIMARY_MISSING`,primaryInvalidCode=`${codePrefix}_PRIMARY_INVALID`}={}){
    const target=String(filePath??pathValue??'');
    if(!isAbsolute(target))throw new Error(`${codePrefix}_ABSOLUTE_PATH_REQUIRED`);
    this.filePath=target;this.tempPath=`${target}.tmp`;this.verify=verify;this.valueRoot=valueRoot;this.codePrefix=codePrefix;this.invalidValueCode=invalidValueCode;this.primaryMissingCode=primaryMissingCode;this.primaryInvalidCode=primaryInvalidCode;
  }
  verifyValue(value){return validResult(this.verify(clone(value)));}
  async save(value,{faultAt}={}){
    const candidate=clone(value),verification=this.verifyValue(candidate);
    if(!verification.valid)throw new Error(`${this.invalidValueCode}:${verification.errors.join(',')}`);
    await mkdir(dirname(this.filePath),{recursive:true});
    const serialized=JSON.stringify(candidate),handle=await open(this.tempPath,'w');
    let fileSynced=false;
    try{await handle.writeFile(serialized,'utf8');await handle.sync();fileSynced=true;}finally{await handle.close();}
    injectFault(this.codePrefix,faultAt,'after-temp-sync');
    await rename(this.tempPath,this.filePath);
    injectFault(this.codePrefix,faultAt,'after-rename');
    const directorySynced=await syncDirectory(dirname(this.filePath));
    return{operation:'SAVE',status:'COMMITTED',source:'temp_rename',valueRoot:this.valueRoot(candidate),bytes:Buffer.byteLength(serialized,'utf8'),atomicRename:true,fileSynced,directorySynced};
  }
  async readCandidate(filePath){
    try{
      const serialized=await readFile(filePath,'utf8');
      let value;
      try{value=JSON.parse(serialized);}catch(error){return{exists:true,valid:false,value:null,bytes:Buffer.byteLength(serialized,'utf8'),error:`JSON_PARSE:${error.message}`};}
      const verification=this.verifyValue(value);
      return{exists:true,valid:verification.valid,value:verification.valid?clone(value):null,bytes:Buffer.byteLength(serialized,'utf8'),error:verification.valid?null:verification.errors.join(',')};
    }catch(error){
      if(error.code==='ENOENT')return{exists:false,valid:false,value:null,bytes:0,error:null};
      return{exists:true,valid:false,value:null,bytes:0,error:`${error.code??error.name}:${error.message}`};
    }
  }
  async load(){
    const primary=await this.readCandidate(this.filePath);
    if(!primary.exists)throw new Error(this.primaryMissingCode);
    if(!primary.valid)throw new Error(`${this.primaryInvalidCode}:${primary.error??'unknown'}`);
    return clone(primary.value);
  }
  async recover(){
    const primary=await this.readCandidate(this.filePath),temporary=await this.readCandidate(this.tempPath);
    if(primary.valid)return{status:'RECOVERED',source:'primary',value:clone(primary.value),receipt:{operation:'RECOVER',status:'RECOVERED',source:'primary',valueRoot:this.valueRoot(primary.value),bytes:primary.bytes,atomicRename:true,fileSynced:true,directorySynced:false},diagnostics:{primary:'VALID',temporary:temporary.valid?'VALID_IGNORED':temporary.exists?'INVALID_IGNORED':'MISSING'}};
    if(temporary.valid){
      await rename(this.tempPath,this.filePath);
      const directorySynced=await syncDirectory(dirname(this.filePath));
      return{status:'RECOVERED',source:'temporary_promoted',value:clone(temporary.value),receipt:{operation:'RECOVER',status:'RECOVERED',source:'temporary_promoted',valueRoot:this.valueRoot(temporary.value),bytes:temporary.bytes,atomicRename:true,fileSynced:true,directorySynced},diagnostics:{primary:primary.exists?'INVALID':'MISSING',temporary:'VALID_PROMOTED'}};
    }
    return{status:primary.exists||temporary.exists?'CORRUPT':'EMPTY',source:null,value:null,receipt:null,diagnostics:{primary:primary.exists?`INVALID:${primary.error??'unknown'}`:'MISSING',temporary:temporary.exists?`INVALID:${temporary.error??'unknown'}`:'MISSING'}};
  }
}
