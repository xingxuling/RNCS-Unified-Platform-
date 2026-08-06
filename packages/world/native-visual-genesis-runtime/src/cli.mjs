#!/usr/bin/env node
import path from 'node:path';
import {buildNativeShot} from './build.mjs';

function argument(name, fallback=null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const command = process.argv[2] ?? 'build-shot';
if (command !== 'build-shot') throw new Error(`UNKNOWN_NATIVE_VISUAL_COMMAND:${command}`);
const repoRoot = path.resolve(process.cwd());
const outDir = path.resolve(argument('--out', path.join('evidence', 'anime-forge-phase6-native-visual-v0.1')));
const baselineFrame = argument('--baseline', path.join('evidence', 'anime-forge-phase4-v0.1', 'representative-frames', 'frame-000096-S01.png'));
const result = await buildNativeShot({outDir, baselineFrame: path.resolve(baselineFrame), ffmpegPath: argument('--ffmpeg'), ffprobePath: argument('--ffprobe'), keepWorking: argument('--no-working') === null});
console.log(JSON.stringify({status: result.status, outDir: result.outDir, mp4: result.mux, probe: result.probeValidation, sequence_root: result.frameManifest.sequence_root, repair: result.repairReceipt}, null, 2));
