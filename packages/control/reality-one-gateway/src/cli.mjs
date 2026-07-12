#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {RealityOneGateway} from './gateway.mjs';import {runIntentAuthorityPipeline} from './pipeline.mjs';import {loadPipelineConfig} from './config.mjs';import {startServer} from './server.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const args=process.argv.slice(2),cmd=args.shift();const opt=n=>{const i=args.indexOf(n);return i>=0?args[i+1]:null};const manifests=(opt('--runtimes')??path.join(root,'runtimes')).split(path.delimiter);const dataDir=opt('--data')??path.join(root,'output/gateway-data');
const out=v=>process.stdout.write(JSON.stringify(v,null,2)+'\n');
try{
 if(cmd==='serve'){const {url}=await startServer({port:Number(opt('--port')??17303),host:opt('--host')??'127.0.0.1',manifestDirs:manifests,dataDir});console.log(`Reality One Gateway v0.3: ${url}`);}
 else{const g=new RealityOneGateway({manifestDirs:manifests,dataDir});await g.discover();if(cmd==='discover')out(g.registry);else if(cmd==='health')out(await g.health());else if(cmd==='invoke'){const runtime=opt('--runtime'),action=opt('--action'),payload=opt('--payload')?JSON.parse(fs.readFileSync(path.resolve(opt('--payload')),'utf8')):{};out(await g.invoke(runtime,action,payload));}else if(cmd==='pipeline'){const cfg=loadPipelineConfig(opt('--config')??path.join(root,'examples/input/pipeline.json')),dir=path.resolve(opt('--out')??path.join(root,'output/demo'));out(await runIntentAuthorityPipeline(g,cfg,{outDir:dir}));}else{console.log('Usage: reality-one discover|health|invoke|pipeline|serve');process.exitCode=2;}}
}catch(e){console.error(JSON.stringify({error:{code:e.code??'ERROR',message:e.message,details:e.details??{}}},null,2));process.exitCode=1;}
