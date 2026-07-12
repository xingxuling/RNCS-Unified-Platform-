import fs from 'node:fs';
import path from 'node:path';
export function readInvocationReceipts(dataDir,{limit=20}={}){const file=path.join(dataDir,'journal','invocations.ndjson');if(!fs.existsSync(file))return[];return fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).slice(-Math.max(1,Math.min(100,limit))).map(line=>JSON.parse(line)).reverse();}
