import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const args=process.argv.slice(2);
const outIndex=args.indexOf('--out');
const requested=path.resolve(outIndex>=0?(args[outIndex+1]??'tmp/RNCS-Character-Genome-Forge-v0.1-source.zip'):'tmp/RNCS-Character-Genome-Forge-v0.1-source.zip');
const zipFile=requested.toLowerCase().endsWith('.zip')?requested:`${requested}.zip`;
const stageDir=path.join(path.dirname(zipFile),`${path.basename(zipFile,'.zip')}.source`);

const sourceRoots=[
  '.gitignore',
  'package.json',
  'package-lock.json',
  'docs/rncs-character-genome-forge-v0.1-audit.md',
  'docs/rncs-character-genome-forge-v0.1-status.md',
  'docs/releases/rncs-character-genome-forge-v0.1-release-notes.md',
  'evidence/character-genome-forge-v0.1',
  'scripts/generate-character-genome-evidence.mjs',
  'scripts/package-character-genome-source.mjs',
  'packages/world/character-genome-runtime',
  'packages/world/character-phenotype-compiler',
  'packages/integration/rcl-character-genome-bridge',
  'packages/integration/rcl-anime-production-bridge',
  'packages/world/anime-production-runtime',
  'packages/world/voice-performance-runtime',
  'packages/world/audio-scene-runtime',
  'packages/world/reality-asset-genesis-fabric/package.json',
  'packages/world/reality-asset-genesis-fabric/README.md',
  'packages/world/reality-asset-genesis-fabric/src/canonical.mjs',
  'packages/world/reality-asset-genesis-fabric/src/contracts.mjs',
  'packages/world/reality-asset-genesis-fabric/src/gltf.mjs',
  'packages/world/reality-asset-genesis-fabric/src/png.mjs',
  'packages/world/reality-asset-genesis-fabric/src/providers.mjs',
  'packages/world/reality-asset-genesis-fabric/tests/character-genome-provider.test.mjs',
  'packages/world/visual-state-runtime/package.json',
  'packages/world/visual-state-runtime/src/character-profile.mjs',
  'packages/world/visual-state-runtime/src/anime-profile.mjs',
  'packages/world/visual-state-runtime/src/unified-index.mjs',
  'packages/world/visual-state-runtime/schemas/vsr-character-visual-profile.v0.1.schema.json',
  'packages/world/visual-state-runtime/schemas/vsr-anime-rendering-profile.v0.1.schema.json',
  'packages/world/reality-simulation-runtime/package.json',
  'packages/world/reality-simulation-runtime/src/character-body.mjs',
  'packages/world/reality-simulation-runtime/src/anime-motion.mjs',
  'packages/world/reality-simulation-runtime/src/unified-index.mjs',
  'packages/world/reality-simulation-runtime/schemas/rsr-character-body-profile.v0.1.schema.json',
  'packages/world/reality-simulation-runtime/schemas/rsr-anime-secondary-motion-profile.v0.1.schema.json',
  'apps/reality-studio/package.json',
  'apps/reality-studio/README.md',
  'apps/reality-studio/CHANGELOG.md',
  'apps/reality-studio/STATUS.md',
  'apps/reality-studio/RELEASE_NOTES_v1.6.0-alpha.1.md',
  'apps/reality-studio/src/cli.mjs',
  'apps/reality-studio/src/server.mjs',
  'apps/reality-studio/src/character-genome-studio.mjs',
  'apps/reality-studio/src/anime-forge-studio.mjs',
  'apps/reality-studio/web/index.html',
  'apps/reality-studio/web/app.js',
  'apps/reality-studio/web/character-genome.html',
  'apps/reality-studio/web/anime-forge.html',
  'apps/reality-studio/tests/character-genome.test.mjs',
  'apps/reality-studio/tests/browser_character_genome_test.py',
  'apps/reality-studio/tests/anime-forge.test.mjs',
  'apps/reality-studio/tests/server.test.mjs',
  'apps/reality-studio/tests/asset-forge-server.test.mjs',
];

const excludedNames=new Set(['node_modules','outputs','output','dist','coverage','.replay','snapshots']);
const normalized=value=>value.split(path.sep).join('/');
const sourceFiles=new Set();

function collect(relative){
  const absolute=path.resolve(root,relative);
  if(!absolute.startsWith(`${path.resolve(root)}${path.sep}`)&&absolute!==path.resolve(root))throw new Error(`SOURCE_PACKAGE_PATH_ESCAPE:${relative}`);
  if(!fs.existsSync(absolute))throw new Error(`SOURCE_PACKAGE_FILE_MISSING:${relative}`);
  const stat=fs.statSync(absolute);
  if(stat.isFile()){
    if(!normalized(relative).split('/').some(part=>excludedNames.has(part)))sourceFiles.add(normalized(path.relative(root,absolute)));
    return;
  }
  for(const entry of fs.readdirSync(absolute,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(excludedNames.has(entry.name))continue;
    collect(path.join(relative,entry.name));
  }
}

for(const sourceRoot of sourceRoots)collect(sourceRoot);
const files=[...sourceFiles].sort((a,b)=>a.localeCompare(b));
const manifestFiles=files.map(relative=>{
  const bytes=fs.readFileSync(path.join(root,relative));
  return{path:relative,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
});
const packageManifest={
  format:'rncs.character-genome-forge-source-package.v0.1',
  version:'0.1.0-alpha.1',
  created_at:'2026-08-06T00:00:00.000Z',
  scope:'implemented Character Genome reference chain, contracts, tests and evidence',
  status:'reference-foundation',
  file_count:manifestFiles.length,
  files:manifestFiles,
  boundaries:{provider:'offline deterministic reference provider',quality:'not commercial final art',acceptance:'no external GPU, DCC, clean-machine or human acceptance claim'},
};
packageManifest.package_root=crypto.createHash('sha256').update(JSON.stringify(packageManifest)).digest('hex');
const manifestBytes=Buffer.from(`${JSON.stringify(packageManifest,null,2)}\n`);

fs.mkdirSync(path.dirname(zipFile),{recursive:true});
if(fs.existsSync(stageDir))fs.rmSync(stageDir,{recursive:true,force:true});
fs.mkdirSync(stageDir,{recursive:true});
for(const relative of files){
  const target=path.join(stageDir,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(path.join(root,relative),target);
}
fs.writeFileSync(path.join(stageDir,'source-package-manifest.json'),manifestBytes);

const crcTable=Array.from({length:256},(_,index)=>{
  let value=index;
  for(let bit=0;bit<8;bit++)value=(value&1)?(0xedb88320^(value>>>1)):(value>>>1);
  return value>>>0;
});
function crc32(bytes){
  let value=0xffffffff;
  for(const byte of bytes)value=crcTable[(value^byte)&0xff]^(value>>>8);
  return(value^0xffffffff)>>>0;
}

function createZip(entries){
  const localParts=[],centralParts=[];
  let offset=0;
  const dosTime=0;
  const dosDate=((2026-1980)<<9)|(1<<5)|1;
  for(const entry of entries){
    const name=Buffer.from(entry.name,'utf8'),data=entry.bytes,crc=crc32(data);
    const local=Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x0800,6);local.writeUInt16LE(0,8);
    local.writeUInt16LE(dosTime,10);local.writeUInt16LE(dosDate,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);local.writeUInt16LE(0,28);
    localParts.push(local,name,data);
    const central=Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x0800,8);central.writeUInt16LE(0,10);
    central.writeUInt16LE(dosTime,12);central.writeUInt16LE(dosDate,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(name.length,28);central.writeUInt16LE(0,30);central.writeUInt16LE(0,32);central.writeUInt16LE(0,34);central.writeUInt16LE(0,36);central.writeUInt32LE(0,38);central.writeUInt32LE(offset,42);
    centralParts.push(central,name);
    offset+=local.length+name.length+data.length;
  }
  const centralSize=centralParts.reduce((sum,item)=>sum+item.length,0),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(0,4);end.writeUInt16LE(0,6);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(centralSize,12);end.writeUInt32LE(offset,16);end.writeUInt16LE(0,20);
  return Buffer.concat([...localParts,...centralParts,end]);
}

const archiveEntries=files.map(relative=>({name:relative,bytes:fs.readFileSync(path.join(root,relative))}));
archiveEntries.push({name:'source-package-manifest.json',bytes:manifestBytes});
fs.writeFileSync(zipFile,createZip(archiveEntries));
const zipSha256=crypto.createHash('sha256').update(fs.readFileSync(zipFile)).digest('hex');
console.log(JSON.stringify({ok:true,zip:zipFile,staging:stageDir,file_count:manifestFiles.length,archive_file_count:archiveEntries.length,package_root:packageManifest.package_root,zip_sha256:zipSha256},null,2));
