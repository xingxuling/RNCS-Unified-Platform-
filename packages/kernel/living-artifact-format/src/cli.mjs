#!/usr/bin/env node
import fs from 'node:fs';
import {readArtifact,rootHash,validateArtifact} from './index.mjs';
const [cmd,...args]=process.argv.slice(2);
const emit=x=>console.log(JSON.stringify(x,null,2));
try{
 if(cmd==='validate') {const r=validateArtifact(readArtifact(args[0]));emit(r);process.exitCode=r.valid?0:2;}
 else if(cmd==='hash') emit({root:rootHash(JSON.parse(fs.readFileSync(args[0],'utf8')))});
 else {emit({error:'usage: laf-js validate <artifact.json> | hash <json>'});process.exitCode=2;}
}catch(e){emit({valid:false,error:`${e.constructor.name}:${e.message}`});process.exitCode=2;}
