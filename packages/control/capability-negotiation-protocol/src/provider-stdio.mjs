#!/usr/bin/env node
import readline from 'node:readline'; import fs from 'node:fs'; import { normalizeProvider } from './contracts.mjs';
const path=process.argv[2]; if(!path){console.error('Usage: cnp-provider <provider.json>');process.exit(2)}
const provider=normalizeProvider(JSON.parse(fs.readFileSync(path,'utf8')));
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of rl){if(!line.trim())continue;let req;try{req=JSON.parse(line);let result;if(req.method==='handshake')result={provider_id:provider.provider_id,protocol_versions:provider.protocol_versions,provider_root:provider.provider_root};else if(req.method==='discover')result=provider;else if(req.method==='health')result={status:provider.status,provider_root:provider.provider_root};else throw new Error('unknown method');process.stdout.write(JSON.stringify({id:req.id,result})+'\n');}catch(e){process.stdout.write(JSON.stringify({id:req?.id??null,error:e.message})+'\n');}}
