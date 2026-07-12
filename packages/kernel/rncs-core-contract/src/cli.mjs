#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { newProposal, authorize, commit, attachProjection, verify, adaptHnacSnapshot } from './index.mjs';
const args=Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith('--')?[v.slice(2),a[i+1]]:null).filter(Boolean));
const cmd=process.argv[2]??'help', load=async p=>JSON.parse(await readFile(p,'utf8')), save=async(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
if(cmd==='verify')console.log(JSON.stringify(verify(await load(args.envelope)),null,2));
else if(cmd==='propose')await save(args.out,newProposal(await load(args.input)));
else if(cmd==='authorize')await save(args.out,authorize(await load(args.envelope),{status:args.status,resolver:args.resolver,reason:args.reason??''}));
else if(cmd==='commit')await save(args.out,commit(await load(args.envelope),{generation:Number(args.generation),generation_root:args['generation-root']}));
else if(cmd==='project')await save(args.out,attachProjection(await load(args.envelope),await load(args.projection)));
else if(cmd==='adapt-hnac')await save(args.out,adaptHnacSnapshot(await load(args.input),args['host-id']));
else console.log('commands: propose authorize commit project verify adapt-hnac');
