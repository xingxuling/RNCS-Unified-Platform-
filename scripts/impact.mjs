import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const reg=JSON.parse(fs.readFileSync(path.join(root,'rncs.modules.json'),'utf8'));const changed=process.argv.slice(2).map(x=>x.replaceAll('\\','/'));
const direct=new Set();for(const f of changed)for(const m of reg.modules)if(f===m.path||f.startsWith(m.path+'/'))direct.add(m.id);
if(changed.some(f=>['rncs.modules.json','package.json','package-lock.json'].includes(f)||f.startsWith('scripts/')))for(const m of reg.modules)direct.add(m.id);
const affected=new Set(direct);let again=true;while(again){again=false;for(const m of reg.modules)if(!affected.has(m.id)&&m.dependsOn.some(d=>affected.has(d))){affected.add(m.id);again=true;}}
const result={changed,direct:[...direct],affected:reg.modules.filter(m=>affected.has(m.id)).map(m=>m.id)};console.log(JSON.stringify(result,null,2));
