import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPhase62Evidence} from '../packages/world/native-character-morphogenesis-runtime/src/build62.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.ANIME_PHASE6_2_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_2_EVIDENCE_DIR):path.join(root,'evidence/anime-forge-phase6-2-canonical-morphology-v0.1');
const result=buildPhase62Evidence({outDir:out});
console.log(JSON.stringify({format:'rncs.anime-forge-phase6-2-build-command.v0.1',out_dir:out,status:result.phaseStatus.status,media:result.episode.media,frames:result.episode.frameManifest.frame_count,cuts:result.episode.cuts.length,morphology_root:result.system.canonical_morphology_asset.morphology_root,validation_pack_root:result.validationPack.pack_root,ledger_internal_root:result.ledger.ledger_internal_root},null,2));
