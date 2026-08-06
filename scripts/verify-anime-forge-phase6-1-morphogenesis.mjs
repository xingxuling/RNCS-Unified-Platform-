import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePhase61Evidence} from '../packages/world/native-character-morphogenesis-runtime/src/build.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.ANIME_PHASE6_1_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_1_EVIDENCE_DIR):path.join(root,'evidence/anime-forge-phase6-1-morphogenesis-surgery-v0.1');
const result=validatePhase61Evidence(out);console.log(JSON.stringify({format:'rncs.anime-forge-phase6-1-verify-command.v0.1',out_dir:out,...result},null,2));if(!result.valid)process.exitCode=1;
