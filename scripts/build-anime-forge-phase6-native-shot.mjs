import path from 'node:path';
import {buildNativeShot} from '../packages/world/native-visual-genesis-runtime/src/build.mjs';

const repoRoot = process.cwd();
const outDir = path.resolve(process.env.RNCS_NATIVE_SHOT_OUT ?? path.join('evidence', 'anime-forge-phase6-native-visual-v0.1'));
const baselineFrame = path.resolve(process.env.RNCS_PHASE4_BASELINE ?? path.join('evidence', 'anime-forge-phase4-v0.1', 'representative-frames', 'frame-000096-S01.png'));
const result = await buildNativeShot({outDir, baselineFrame, ffmpegPath: process.env.FFMPEG_PATH ?? null, ffprobePath: process.env.FFPROBE_PATH ?? null, keepWorking: process.env.RNCS_KEEP_NATIVE_WORKING !== '0'});
console.log(JSON.stringify({status: result.status, outDir: result.outDir, mp4: result.mux, probe: result.probeValidation, sequence_root: result.frameManifest.sequence_root, repair_receipt_root: result.repairReceipt.repair_receipt_root}, null, 2));
