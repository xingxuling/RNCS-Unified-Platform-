import { CNPError } from './canonical.mjs';
export function parseVersion(v){
 const m=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/.exec(v??'');
 if(!m) throw new CNPError('INVALID_SEMVER',`Invalid semantic version: ${v}`);
 return {major:+m[1],minor:+m[2],patch:+m[3],pre:m[4]??null,raw:v};
}
export function compareVersions(a,b){
 const x=parseVersion(a),y=parseVersion(b);
 for(const k of ['major','minor','patch']) if(x[k]!==y[k]) return x[k]-y[k];
 if(x.pre===y.pre)return 0; if(x.pre===null)return 1; if(y.pre===null)return -1; return x.pre.localeCompare(y.pre);
}
export function satisfies(version, range='*'){
 parseVersion(version); if(!range||range==='*')return true;
 const clauses=range.trim().split(/\s+/);
 return clauses.every(c=>{
  if(c.startsWith('^')){const b=parseVersion(c.slice(1)),v=parseVersion(version);return v.major===b.major&&compareVersions(version,b.raw)>=0;}
  if(c.startsWith('~')){const b=parseVersion(c.slice(1)),v=parseVersion(version);return v.major===b.major&&v.minor===b.minor&&compareVersions(version,b.raw)>=0;}
  for(const op of ['>=','<=','>','<','=']) if(c.startsWith(op)){const q=c.slice(op.length),n=compareVersions(version,q);return op==='>='?n>=0:op==='<='?n<=0:op==='>'?n>0:op==='<'?n<0:n===0;}
  return compareVersions(version,c)===0;
 });
}
export function chooseProtocol(local, remote){
 const common=local.filter(x=>remote.includes(x)).sort(compareVersions).reverse();
 if(!common.length) throw new CNPError('NO_COMMON_PROTOCOL','No common CNP protocol version',{local,remote});
 return common[0];
}
