#!/usr/bin/env node
import fs from 'node:fs';import {RealityStore,verifyExternalGeneration} from './index.mjs';
const args=process.argv.slice(2),cmd=args.shift(),flag=n=>{const i=args.indexOf(n);if(i<0)return null;const v=args[i+1];args.splice(i,2);return v},print=v=>console.log(JSON.stringify(v,null,2));
try{
 if(cmd==='init'){const p=args.shift();print(RealityStore.init(p,{worldId:flag('--world')??'world:default',branchId:flag('--branch')??'branch:main'}).currentGeneration())}
 else if(cmd==='verify')print(new RealityStore(args[0]).verify())
 else if(cmd==='current')print(new RealityStore(args[0]).currentGeneration(flag('--branch')??undefined))
 else if(cmd==='get-fact'){const s=new RealityStore(args.shift()),subject=args.shift(),predicate=args.shift();print(s.getFact(subject,predicate,{branchId:flag('--branch')??undefined}))}
 else if(cmd==='commit'){const p=args.shift(),opsArg=args.shift(),actor=flag('--actor'),authority=flag('--authority'),intent=JSON.parse(flag('--intent')??'{}'),branchId=flag('--branch')??undefined,transactionId=flag('--transaction-id')??undefined;const operations=fs.existsSync(opsArg)?JSON.parse(fs.readFileSync(opsArg,'utf8')):JSON.parse(opsArg);print(new RealityStore(p).commit({actor,authority,intent,operations,branchId,transactionId}))}
 else if(cmd==='generation-ref')print(new RealityStore(args[0]).generationReference({branchId:flag('--branch')??undefined}))
 else if(cmd==='verify-external')print(verifyExternalGeneration(args.shift(),flag('--objects-root')))
 else throw new Error('Usage: rfe-core-js <init|verify|current|get-fact|commit|generation-ref|verify-external> ...')
}catch(e){console.error(JSON.stringify({ok:false,error:e.message,code:e.code??'ERROR'},null,2));process.exit(1)}
