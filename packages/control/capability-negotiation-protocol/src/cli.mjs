#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
import { normalizeDescriptor,normalizeProvider,normalizeRequest,validateDescriptor,validateProvider,validateRequest } from './contracts.mjs';
import { negotiate,explain } from './negotiator.mjs'; import { providerFromIcarRegistry,providerFromLaf,fromHnacManifest } from './adapters.mjs';
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null} function load(p){return JSON.parse(fs.readFileSync(p,'utf8'))} function save(p,x){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n')}
const [,,cmd,...rest]=process.argv;
try{
 if(cmd==='validate'){const kind=arg('--kind')??'descriptor',file=arg('--file')??rest[0];const x=load(file);const r=kind==='provider'?validateProvider(x):kind==='request'?validateRequest(x):validateDescriptor(x);console.log(JSON.stringify(r,null,2));process.exit(r.valid?0:1)}
 if(cmd==='seal'){const kind=arg('--kind'),file=arg('--file')??rest[0],out=arg('--out');const x=load(file);const y=kind==='provider'?normalizeProvider(x):kind==='request'?normalizeRequest(x):normalizeDescriptor(x);out?save(out,y):console.log(JSON.stringify(y,null,2));process.exit(0)}
 if(cmd==='negotiate'){const req=load(arg('--request'));const dir=arg('--providers');const providers=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort().map(x=>load(path.join(dir,x)));const result=negotiate({request:req,providers});const out=arg('--out');out?save(out,result):console.log(JSON.stringify(result,null,2));process.exit(result.plan.status==='satisfied'?0:3)}
 if(cmd==='explain'){console.log(JSON.stringify(explain(load(arg('--file')??rest[0])),null,2));process.exit(0)}
 if(cmd==='import-icar'){const p=providerFromIcarRegistry(load(arg('--file')??rest[0]),arg('--provider-id')??undefined);const out=arg('--out');out?save(out,p):console.log(JSON.stringify(p,null,2));process.exit(0)}
 if(cmd==='import-laf'){const p=providerFromLaf(load(arg('--file')??rest[0]));const out=arg('--out');out?save(out,p):console.log(JSON.stringify(p,null,2));process.exit(0)}
 if(cmd==='import-hnac'){const p=fromHnacManifest(load(arg('--file')??rest[0]));const out=arg('--out');out?save(out,p):console.log(JSON.stringify(p,null,2));process.exit(0)}
 console.log('CNP v0.1 CLI\nCommands: validate, seal, negotiate, explain, import-icar, import-laf, import-hnac');
}catch(e){console.error(JSON.stringify({error:e.code??'ERROR',message:e.message,details:e.details??{}},null,2));process.exit(2)}
