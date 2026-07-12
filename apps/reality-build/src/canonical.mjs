import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export class BuildError extends Error{
  constructor(code,message='',details={}){super(`${code}${message?`: ${message}`:''}`);this.name='BuildError';this.code=code;this.details=details;}
}
export const clone=v=>structuredClone(v);
function cmp(a,b){return Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8'));}
export function canonicalJson(v){
  if(v===null)return'null';if(v===true)return'true';if(v===false)return'false';
  if(typeof v==='number'){if(!Number.isFinite(v))throw new BuildError('NON_FINITE_NUMBER');return Object.is(v,-0)?'0':String(Number(v.toFixed(9)));}
  if(typeof v==='string')return JSON.stringify(v);
  if(Array.isArray(v))return`[${v.map(canonicalJson).join(',')}]`;
  if(v&&typeof v==='object')return`{${Object.keys(v).filter(k=>v[k]!==undefined).sort(cmp).map(k=>`${canonicalJson(k)}:${canonicalJson(v[k])}`).join(',')}}`;
  throw new BuildError('CANONICAL_UNSUPPORTED',typeof v);
}
export const sha256=v=>createHash('sha256').update(typeof v==='string'?v:Buffer.from(v)).digest('hex');
export const rootHash=v=>sha256(canonicalJson(v));
export function seal(value,field='root'){const out=clone(value);delete out[field];out[field]=rootHash(out);return out;}
export function verifySeal(value,field='root'){if(!value||typeof value!=='object'||typeof value[field]!=='string')return false;const copy=clone(value),actual=copy[field];delete copy[field];return actual===rootHash(copy);}
export function ensureDir(p){fs.mkdirSync(p,{recursive:true});return p;}
export function writeJson(file,value){ensureDir(path.dirname(file));fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');return file;}
export function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
export function sha256File(file){return createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
export function walkFiles(root){
  const out=[];if(!fs.existsSync(root))return out;
  const visit=dir=>{for(const name of fs.readdirSync(dir).sort(cmp)){const full=path.join(dir,name),st=fs.statSync(full);if(st.isDirectory())visit(full);else if(st.isFile())out.push(full);}};visit(root);return out;
}
export function fileManifest(root,{exclude=[]}={}){
  const skip=new Set(exclude);return walkFiles(root).filter(f=>!skip.has(path.relative(root,f).replaceAll('\\','/'))).map(f=>{const rel=path.relative(root,f).replaceAll('\\','/');return{path:rel,size:fs.statSync(f).size,sha256:sha256File(f)};});
}
export function safeName(v,fallback='artifact'){const s=String(v??'').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').replace(/\s+/g,' ').replace(/[. ]+$/g,'');return s||fallback;}
export function fixedIso(input='2026-07-01T00:00:00.000Z'){const d=new Date(input);if(Number.isNaN(d.valueOf()))throw new BuildError('BUILD_TIME_INVALID',String(input));return d.toISOString();}
export function copyFileDeterministic(src,dst){ensureDir(path.dirname(dst));fs.copyFileSync(src,dst);fs.utimesSync(dst,new Date(0),new Date(0));return dst;}
export function emptyDir(dir){fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});return dir;}
