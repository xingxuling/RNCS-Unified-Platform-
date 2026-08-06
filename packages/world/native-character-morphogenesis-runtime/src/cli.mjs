import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPhase61Evidence,validatePhase61Evidence} from './build.mjs';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../..');
const argument=(name,fallback)=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]??fallback:fallback;};
const command=process.argv[2]??'build';
const outDir=path.resolve(argument('--out',path.join(repoRoot,'evidence/anime-forge-phase6-1-morphogenesis-surgery-v0.1')));

if(command==='build'){
  const baseline=argument('--baseline',null),result=buildPhase61Evidence({outDir,baselineFile:baseline?path.resolve(baseline):null});
  console.log(JSON.stringify({status:result.phaseStatus.media_status==='complete'?'pending-human-review':'blocked',out_dir:outDir,media:result.shot.media,frames:result.shot.frameManifest.frame_count,pack:result.pack.pack_root,ledger:result.ledger.ledger_internal_root},null,2));
}else if(command==='validate'){
  const result=validatePhase61Evidence(outDir);console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
}else{console.error(`Unknown command: ${command}`);process.exitCode=2;}
