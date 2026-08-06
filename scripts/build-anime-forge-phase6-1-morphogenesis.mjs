import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPhase61Evidence} from '../packages/world/native-character-morphogenesis-runtime/src/build.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.ANIME_PHASE6_1_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_1_EVIDENCE_DIR):path.join(root,'evidence/anime-forge-phase6-1-morphogenesis-surgery-v0.1');
const baseline=process.env.PHASE6_BASELINE_PATH&&path.resolve(process.env.PHASE6_BASELINE_PATH);
const result=buildPhase61Evidence({outDir:out,baselineFile:baseline&&baseline});
console.log(JSON.stringify({format:'rncs.anime-forge-phase6-1-build-command.v0.1',out_dir:out,media:result.shot.media,frame_count:result.shot.frameManifest.frame_count,pack_root:result.pack.pack_root,ledger_internal_root:result.ledger.ledger_internal_root},null,2));
