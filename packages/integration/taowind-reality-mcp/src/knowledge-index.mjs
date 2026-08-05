import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const SKIP_DIRS=new Set(['.git','node_modules','dist','build','coverage','.cache','.next','.turbo','output','tmp','temp']);
const ROOT_EXTENSIONS=new Set(['.md','.txt','.json','.yaml','.yml']);
const BLOCKED_NAME=/(?:^|[._-])(secret|token|credential|private[-_]?key|keystore|signing|api[-_]?key)(?:[._-]|$)|^\.env/i;
const hash=value=>createHash('sha256').update(value).digest('hex');
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase();
const occurrences=(text,needle)=>{if(!needle)return 0;let count=0,index=0;while((index=text.indexOf(needle,index))>=0){count++;index+=Math.max(1,needle.length);}return count;};
const isRootFile=relative=>!relative.includes(path.sep);
const isRuntimeManifest=relative=>relative.endsWith('.runtime.json');
const isDocumentation=relative=>relative.split(path.sep).includes('docs')||/README|CHANGELOG|STATUS|REPORT|MANIFEST|验收报告|开发报告/i.test(path.basename(relative));
const eligible=relative=>{const ext=path.extname(relative).toLowerCase();return ROOT_EXTENSIONS.has(ext)&&(isRootFile(relative)||isDocumentation(relative)||isRuntimeManifest(relative));};
const titleFrom=(relative,text)=>{if(relative.toLowerCase().endsWith('.json')){try{const parsed=JSON.parse(text);return parsed.display_name??parsed.name??parsed.title??parsed.runtime_id??path.basename(relative);}catch{}}const heading=text.match(/^#\s+(.+)$/m)?.[1]?.trim();return heading||path.basename(relative);};
const snippet=(text,query,max=240)=>{const flat=text.replace(/\s+/g,' ').trim();const i=normalize(flat).indexOf(normalize(query));if(i<0)return flat.slice(0,max);const start=Math.max(0,i-Math.floor(max/3));return `${start?'…':''}${flat.slice(start,start+max)}${start+max<flat.length?'…':''}`;};
const listOf=value=>{if(value===undefined||value===null)return[];return[...(Array.isArray(value)?value:[value])].map(item=>String(item??'').trim()).filter(Boolean);};
const label=value=>String(value??'source').trim().replace(/[^a-zA-Z0-9._:-]+/g,'_').slice(0,160)||'source';
const textOf=value=>String(value?.text??value?.content??'');

export const REPOSITORY_NAMESPACE='repository';
export const EPHEMERAL_SOURCE_PACKET_FORMAT='rncs.ephemeral-source-packet.v0.1';

const documentMetadata=(document,extra={})=>({
 path:document.relative_path,
 sha256:document.sha256,
 size_bytes:document.size_bytes,
 namespace:document.namespace,
 evidence_role:document.evidence_role,
 persistent:document.persistent,
 source_kind:document.source_kind,
 domain:document.domain,
 ...(document.packet_id?{packet_id:document.packet_id}:{}),
 ...(document.source_uri?{source_uri:document.source_uri}:{}),
 ...extra
});

export class KnowledgeIndex{
 constructor({repoRoot,publicBaseUrl='',artifactBaseUrl='',maxFileBytes=512_000,maxTotalBytes=24_000_000,maxFetchChars=200_000}={}){
  this.repoRoot=path.resolve(repoRoot);
  this.publicBaseUrl=publicBaseUrl;
  this.artifactBaseUrl=artifactBaseUrl;
  this.maxFileBytes=maxFileBytes;
  this.maxTotalBytes=maxTotalBytes;
  this.maxFetchChars=maxFetchChars;
  this.documents=[];
  this.byId=new Map();
  this.sourcePackets=new Map();
  this.generatedAt=null;
 }
 urlFor(id){return this.artifactBaseUrl?`${this.artifactBaseUrl}/${encodeURIComponent(id)}`:`taowind://artifact/${id}`;}
 reindex(){this.documents.sort((a,b)=>a.relative_path.localeCompare(b.relative_path));this.byId.clear();for(const document of this.documents)this.byId.set(document.id,document);}
 build(){
  this.documents=[];
  this.byId.clear();
  this.sourcePackets.clear();
  let total=0;
  const walk=dir=>{
   for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.')&&entry.name!=='.well-known')continue;
    if(BLOCKED_NAME.test(entry.name))continue;
    const absolute=path.join(dir,entry.name),relative=path.relative(this.repoRoot,absolute);
    if(entry.isDirectory()){if(!SKIP_DIRS.has(entry.name))walk(absolute);continue;}
    if(!entry.isFile()||!eligible(relative))continue;
    const stat=fs.statSync(absolute);
    if(stat.size>this.maxFileBytes||total+stat.size>this.maxTotalBytes)continue;
    let text;
    try{text=fs.readFileSync(absolute,'utf8');}catch{continue;}
    if(text.includes('\u0000'))continue;
    total+=stat.size;
    const id=`artifact-${hash(relative).slice(0,20)}`;
    this.documents.push({
     id,
     title:titleFrom(relative,text),
     relative_path:relative.split(path.sep).join('/'),
     absolute_path:absolute,
     text,
     size_bytes:stat.size,
     sha256:hash(text),
     url:this.urlFor(id),
     normalized:normalize(`${relative}\n${text}`),
     namespace:REPOSITORY_NAMESPACE,
     evidence_role:'repository-artifact',
     persistent:true,
     source_kind:'workspace-file',
     domain:'rncs'
    });
   }
  };
  walk(this.repoRoot);
  this.reindex();
  this.generatedAt=new Date().toISOString();
  return this.stats();
 }
 stats(){
  const namespaceCounts=Object.create(null);
  for(const document of this.documents)namespaceCounts[document.namespace]=(namespaceCounts[document.namespace]??0)+1;
  return{
   document_count:this.documents.length,
   total_bytes:this.documents.reduce((sum,item)=>sum+item.size_bytes,0),
   generated_at:this.generatedAt,
   persistent_document_count:this.documents.filter(document=>document.persistent).length,
   ephemeral_document_count:this.documents.filter(document=>!document.persistent).length,
   source_packet_count:this.sourcePackets.size,
   namespace_counts:namespaceCounts
  };
 }
 ingestSourcePacket(packet,{namespace='temporary-user-source'}={}){
  const entries=Array.isArray(packet)?packet:packet?.sources??packet?.documents;
  if(!Array.isArray(entries)||entries.length===0)throw Object.assign(new Error('Source packet must contain at least one source.'),{code:'SOURCE_PACKET_INVALID'});
  const packetId=String(Array.isArray(packet)?`packet-${hash(JSON.stringify(packet)).slice(0,20)}`:packet.packet_id??packet.packetId??`packet-${hash(JSON.stringify(packet)).slice(0,20)}`);
  const packetNamespace=String(Array.isArray(packet)?namespace:packet.namespace??namespace).trim()||'temporary-user-source';
  const packetRoot=hash(JSON.stringify({format:EPHEMERAL_SOURCE_PACKET_FORMAT,packetId,namespace:packetNamespace,entries}));
  const documents=entries.map((entry,index)=>{
   const source=typeof entry==='string'?{text:entry}:entry??{};
   const text=textOf(source);
   if(!text.trim())throw Object.assign(new Error(`Source packet entry ${index} has no text.`),{code:'SOURCE_PACKET_INVALID'});
   const sourceId=String(source.source_id??source.sourceId??source.id??`${packetId}:${index}`);
   const id=`source-${hash(`${packetId}:${index}:${sourceId}:${text}`).slice(0,20)}`;
   const relativePath=`[${label(packetNamespace)}]/${label(source.path??source.relative_path??source.title??sourceId)}`;
   return{
    id,
    title:String(source.title??titleFrom(relativePath,text)),
    relative_path:relativePath,
    absolute_path:null,
    text,
    size_bytes:Buffer.byteLength(text,'utf8'),
    sha256:hash(text),
    url:this.urlFor(id),
    normalized:normalize(`${relativePath}\n${text}`),
    namespace:packetNamespace,
    evidence_role:String(source.evidence_role??source.evidenceRole??'external-research'),
    persistent:false,
    source_kind:String(source.source_kind??source.sourceKind??'ephemeral-source'),
    domain:String(source.domain??'external'),
    packet_id:packetId,
    source_uri:source.source_uri??source.sourceUri??source.uri??source.url
   };
  });
  const oldIds=new Set(this.documents.filter(document=>document.packet_id===packetId).map(document=>document.id));
  this.documents=this.documents.filter(document=>!oldIds.has(document.id));
  this.documents.push(...documents);
  this.sourcePackets.set(packetId,{packet_id:packetId,packet_root:packetRoot,namespace:packetNamespace,document_ids:documents.map(document=>document.id)});
  this.reindex();
  this.generatedAt=new Date().toISOString();
  return{format:EPHEMERAL_SOURCE_PACKET_FORMAT,packet_id:packetId,packet_root:packetRoot,namespace:packetNamespace,document_count:documents.length,document_ids:documents.map(document=>document.id)};
 }
 dropSourcePacket(packetId){
  const id=String(packetId??'');
  const documentIds=new Set(this.documents.filter(document=>document.packet_id===id).map(document=>document.id));
  this.documents=this.documents.filter(document=>!documentIds.has(document.id));
  this.sourcePackets.delete(id);
  this.reindex();
  this.generatedAt=new Date().toISOString();
  return{packet_id:id,removed_count:documentIds.size};
 }
 search(query,{limit=8,namespace,namespaces,excludedNamespaces=[],evidenceRoles=[],sourceOnly=false,persistentOnly=false,includeEphemeral=true}={}){
  const q=normalize(query).trim();
  if(!q)return[];
  const allowedNamespaces=listOf(namespaces??namespace);
  const blockedNamespaces=new Set(listOf(excludedNamespaces));
  const allowedRoles=new Set(listOf(evidenceRoles));
  const visible=this.documents.filter(document=>{
   if(!includeEphemeral&&!document.persistent)return false;
   if(sourceOnly&&document.persistent)return false;
   if(persistentOnly&&!document.persistent)return false;
   if(allowedNamespaces.length&&!allowedNamespaces.includes(document.namespace))return false;
   if(blockedNamespaces.has(document.namespace))return false;
   if(allowedRoles.size&&!allowedRoles.has(document.evidence_role))return false;
   return true;
  });
  const terms=[...new Set([q,...q.split(/[\s,，。:：/\\_-]+/).filter(term=>term.length>=2)])];
  return visible.map(document=>{
   const title=normalize(document.title),relative=normalize(document.relative_path);
   let score=0;
   score+=occurrences(title,q)*80+occurrences(relative,q)*50+Math.min(occurrences(document.normalized,q),20)*12;
   for(const term of terms)score+=occurrences(title,term)*20+occurrences(relative,term)*12+Math.min(occurrences(document.normalized,term),10)*3;
   return{document,score};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.document.relative_path.localeCompare(b.document.relative_path)).slice(0,Math.max(1,Math.min(20,limit))).map(({document,score})=>({
   id:document.id,
   title:document.title,
   url:document.url,
   snippet:snippet(document.text,query),
   metadata:documentMetadata(document,{score})
  }));
 }
 fetch(id){
  const document=this.byId.get(id);
  if(!document)throw Object.assign(new Error('Artifact not found.'),{code:'ARTIFACT_NOT_FOUND'});
  const truncated=document.text.length>this.maxFetchChars;
  return{
   id:document.id,
   title:document.title,
   text:truncated?document.text.slice(0,this.maxFetchChars):document.text,
   url:document.url,
   metadata:documentMetadata(document,{truncated})
  };
 }
}
