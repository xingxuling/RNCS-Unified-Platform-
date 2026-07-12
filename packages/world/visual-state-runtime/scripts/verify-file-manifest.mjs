import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const manifest=resolve(process.argv[2]??'FILE_SHA256SUMS.txt');
if(!existsSync(manifest))throw new Error(`找不到文件清单：${manifest}`);
const raw=readFileSync(manifest,'utf8'),lines=raw.split(/\r?\n/).filter(Boolean);const failures=[];
for(const line of lines){const match=line.match(/^([a-f0-9]{64})  (.+)$/);if(!match){failures.push(`格式错误：${line}`);continue;}const [,expected,relative]=match,path=resolve(relative);if(!existsSync(path)){failures.push(`缺少：${relative}`);continue;}const actual=createHash('sha256').update(readFileSync(path)).digest('hex');if(actual!==expected)failures.push(`哈希不符：${relative}`);}
const manifestRoot=createHash('sha256').update(raw).digest('hex');console.log(JSON.stringify({ok:failures.length===0,files:lines.length,manifestRoot,failures},null,2));if(failures.length)process.exitCode=1;
