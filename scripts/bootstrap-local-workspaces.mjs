import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));const nodeModules=path.join(root,'node_modules');fs.mkdirSync(nodeModules,{recursive:true});
const roots=['packages','apps'];let linked=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory()){const pkg=path.join(full,'package.json');if(fs.existsSync(pkg)){const meta=JSON.parse(fs.readFileSync(pkg,'utf8'));if(meta.name?.startsWith('@taowind/')){const [,scopeName]=meta.name.split('/');const scopeDir=path.join(nodeModules,'@taowind');fs.mkdirSync(scopeDir,{recursive:true});const target=path.join(scopeDir,scopeName);fs.rmSync(target,{recursive:true,force:true});fs.symlinkSync(full,target,'dir');linked++;}}else if(!['node_modules','dist','output','outputs','.git'].includes(entry.name))walk(full);}}
}
for(const item of roots){const dir=path.join(root,item);if(fs.existsSync(dir))walk(dir);}console.log(JSON.stringify({status:'ok',linked,nodeModules},null,2));
