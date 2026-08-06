import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePhase62Evidence} from '../packages/world/native-character-morphogenesis-runtime/src/build62.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.ANIME_PHASE6_2_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_2_EVIDENCE_DIR):path.join(root,'evidence/anime-forge-phase6-2-canonical-morphology-v0.1');
const result=validatePhase62Evidence(out);
console.log(JSON.stringify({format:'rncs.anime-forge-phase6-2-verify-command.v0.1',out_dir:out,...result},null,2));
if(!result.valid)process.exitCode=1;
