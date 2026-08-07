import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateGeometricTruthMeasurements} from '../packages/world/native-character-morphogenesis-runtime/src/geometric-truth.mjs';
import {validateMorphologyCertificateV2} from '../packages/world/native-character-morphogenesis-runtime/src/morphology-certificate-v2.mjs';
import {sha256File} from '../packages/world/native-character-morphogenesis-runtime/src/media.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.ANIME_PHASE6_3_EVIDENCE_DIR?path.resolve(process.env.ANIME_PHASE6_3_EVIDENCE_DIR):path.join(root,'evidence/anime-forge-phase6-3-geometric-truth-v0.1');
const read=name=>JSON.parse(fs.readFileSync(path.join(out,name),'utf8'));
const result=(()=>{const certificate=read('strict-morphology-certificate.json'),measurements=read('phase6-3-after-measurements.json'),status=read('phase6-3-status.json'),ledger=read('evidence-ledger.json'),certificateValidation=validateMorphologyCertificateV2(certificate),measurementValidation=validateGeometricTruthMeasurements(measurements),errors=[];if(!certificateValidation.valid)errors.push(...certificateValidation.failures.map(item=>`CERTIFICATE:${item}`));if(!measurementValidation.valid)errors.push(...measurementValidation.errors);if(!fs.existsSync(path.join(out,'phase6-2-failure-measurements.json')))errors.push('HISTORICAL_PHASE6_2_RED_MISSING');if(status.five_second_episode_allowed&&status.status.includes('failed'))errors.push('STATUS_CONTRADICTION');if(status.five_second_episode_allowed&&status.media_status==='blocked-until-static-gates-pass')errors.push('MEDIA_STATUS_CONTRADICTION');if(ledger.status==='pending-human-review'&&!fs.existsSync(path.join(out,'episode.mp4')))errors.push('MEDIA_LEDGER_MP4_MISSING');return{format:'rncs.anime-forge-phase6-3-verify-command.v0.1',out_dir:out,valid:errors.length===0,errors,static_certificate:certificateValidation,geometric_truth:measurementValidation,phase_status:status.status,media_status:status.media_status,media_reason:status.media_reason,media:read('media-result.json'),ledger_root:ledger.ledger_root,ledger_sha256:sha256File(path.join(out,'evidence-ledger.json'))};})();
console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
