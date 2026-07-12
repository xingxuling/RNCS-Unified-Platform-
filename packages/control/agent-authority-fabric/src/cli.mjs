#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';
import {evaluateAuthority,sealPolicyBundle,sealDelegation,sealApproval,sealRevocationRegistry} from './index.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));const write=(p,v)=>{fs.mkdirSync(path.dirname(path.resolve(p)),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')};
const [cmd,...args]=process.argv.slice(2);const arg=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null};
try{
 if(cmd==='seal-policy')write(arg('--out'),sealPolicyBundle(read(arg('--input'))));
 else if(cmd==='seal-delegation')write(arg('--out'),sealDelegation(read(arg('--input'))));
 else if(cmd==='seal-approval')write(arg('--out'),sealApproval(read(arg('--input'))));
 else if(cmd==='seal-revocations')write(arg('--out'),sealRevocationRegistry(read(arg('--input'))));
 else if(cmd==='evaluate'){
   const bundle=read(arg('--input'));const result=evaluateAuthority(bundle);write(arg('--out'),result);console.log(JSON.stringify({status:result.status,decision_root:result.decision_root},null,2));
 } else {console.error('Usage: aaf <seal-policy|seal-delegation|seal-approval|seal-revocations|evaluate> ...');process.exit(2)}
}catch(e){console.error(JSON.stringify({error:e.code??e.name,message:e.message,details:e.details??{}},null,2));process.exit(1)}
