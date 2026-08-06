import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {rootHash} from '../packages/world/native-visual-genesis-runtime/src/canonical.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const evidenceDir = path.resolve(option('--evidence') ?? process.env.RNCS_NATIVE_SHOT_OUT ?? 'evidence/anime-forge-phase6-native-visual-v0.1');
const readJson = name => JSON.parse(fs.readFileSync(path.join(evidenceDir, name), 'utf8'));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const required = ['episode.mp4', 'episode.wav', 'frame-manifest.json', 'provider-manifest.json', 'character-continuity-report.json', 'cut-continuity-report.json', 'audio-video-sync-report.json', 'ffprobe-report.json', 'native-visual-ledger.json', 'phase-status.json', 'repair-receipt.json'];
const checks = {};
const missing = required.filter(name => !fs.existsSync(path.join(evidenceDir, name)));
checks.required_files = missing.length === 0;
if (missing.length) throw new Error(`PHASE6_EVIDENCE_MISSING:${missing.join(',')}`);

const phaseStatus = readJson('phase-status.json');
const manifest = readJson('frame-manifest.json');
const provider = readJson('provider-manifest.json');
const continuity = readJson('character-continuity-report.json');
const cutContinuity = readJson('cut-continuity-report.json');
const sync = readJson('audio-video-sync-report.json');
const probe = readJson('ffprobe-report.json');
const ledger = readJson('native-visual-ledger.json');
const repair = readJson('repair-receipt.json');
const frames = manifest.frames ?? [];
const frameFiles = frames.flatMap(frame => Object.values(frame.files ?? {}).map(file => path.resolve(evidenceDir, file)));
const allFrameFilesExist = frameFiles.length === frames.length * 5 && frameFiles.every(file => fs.existsSync(file) && rootInside(evidenceDir, file));
const colorHashes = frames.map(frame => frame.file_sha256?.color).filter(Boolean);
const nativeProvider = provider.providers?.find(item => item.provider_id === 'rncs.native-2d25d-cpu');
const muxProvider = provider.providers?.find(item => item.provider_id === 'rncs.video-mux.ffmpeg');
checks.native_chain = phaseStatus.native_visual_architecture_status === 'complete' && phaseStatus.native_renderer_status === 'complete' && Boolean(nativeProvider?.real_media);
checks.frame_sequence = manifest.expected_frame_count === 120 && manifest.rendered_frame_count === 120 && frames.length === 120 && allFrameFilesExist;
checks.frame_variation = new Set(colorHashes).size >= 2;
checks.character_continuity = continuity.status === 'pass' && continuity.stable_across_frames === true;
checks.cut_continuity = cutContinuity.status === 'pass' && cutContinuity.seam_count === 0;
checks.audio_video_sync = sync.status === 'pass' && Object.values(sync.checks ?? {}).every(Boolean);
checks.mp4 = fs.readFileSync(path.join(evidenceDir, 'episode.mp4')).subarray(4, 8).toString('ascii') === 'ftyp';
checks.ffprobe = probe.validation?.valid === true;
checks.repair_scope = repair.validation?.valid === true && (repair.identity_roots_unchanged === true || (repair.roots_unchanged?.episode_intent === true && repair.roots_unchanged?.character_identity === true)) && (repair.unaffected_frames_preserved === true || repair.validation?.unaffected_frames_preserved === true);
checks.provider_manifest = Boolean(nativeProvider && muxProvider && nativeProvider.deterministic === true && muxProvider.real_media === true && Array.isArray(nativeProvider.evidence_output));
checks.ledger = ledger.gates?.native_chain === true && ledger.gates?.frame_sequence === true && ledger.gates?.mp4 === true && ledger.gates?.ffprobe === true && ledger.gates?.audio_video_sync === true;

function rootInside(parent, file) {
  const base = path.resolve(parent);
  const target = path.resolve(file);
  return target === base || target.startsWith(`${base}${path.sep}`);
}

function collectFiles(dir, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(prefix, entry.name).split(path.sep).join('/');
    if (entry.name === 'working' || entry.name === 'SHA256SUMS.txt' || entry.name === 'SHA256SUMS.json') continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(file, relative));
    else files.push({path: relative, sha256: sha256(file), bytes: fs.statSync(file).size});
  }
  return files;
}

const artifactFiles = collectFiles(evidenceDir);
const verification = {
  format: 'rncs.anime-forge-phase6-native-evidence-verification.v0.1',
  version: '0.1.0-alpha.1',
  evidence_dir: evidenceDir,
  status: Object.values(checks).every(Boolean) ? 'complete' : 'blocked',
  phase_status: phaseStatus,
  checks,
  programme: {duration_seconds: manifest.duration_seconds, width: manifest.width, height: manifest.height, fps: manifest.fps, expected_frame_count: manifest.expected_frame_count, rendered_frame_count: manifest.rendered_frame_count, unique_color_sha256: new Set(colorHashes).size, cut_count: 1, native_provider: nativeProvider.provider_id},
  media: {mp4: {path: 'episode.mp4', sha256: sha256(path.join(evidenceDir, 'episode.mp4')), bytes: fs.statSync(path.join(evidenceDir, 'episode.mp4')).size}, wav: {path: 'episode.wav', sha256: sha256(path.join(evidenceDir, 'episode.wav')), bytes: fs.statSync(path.join(evidenceDir, 'episode.wav')).size}, ffprobe_report: 'ffprobe-report.json'},
  roots: {ledger_root: ledger.ledger_root, evidence_bundle_root: ledger.evidence_bundle_root, sequence_root: manifest.sequence_root, character_report_root: continuity.report_root, cut_report_root: cutContinuity.report_root, audio_video_sync_root: sync.report_root, repair_receipt_root: repair.repair_receipt_root},
  source_package_sha256: readOptionalSourcePackageHash(),
  artifact_file_count: artifactFiles.length,
  artifact_files_root: rootHash(artifactFiles),
  boundary: 'This verifies an experimental RNCS-native shot and its media/evidence closure. Human visual acceptance and commercial Anime quality remain separate gates.'
};
fs.writeFileSync(path.join(evidenceDir, 'phase6-verification-report.json'), `${JSON.stringify(verification, null, 2)}\n`);
const filesForSums = collectFiles(evidenceDir);
fs.writeFileSync(path.join(evidenceDir, 'SHA256SUMS.txt'), `${filesForSums.map(item => `${item.sha256}  ${item.path}`).join('\n')}\n`);
fs.writeFileSync(path.join(evidenceDir, 'SHA256SUMS.json'), `${JSON.stringify({format: 'rncs.sha256-manifest.v0.1', files: filesForSums, manifest_root: rootHash(filesForSums)}, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({status: verification.status, evidenceDir, checks, mp4_sha256: verification.media.mp4.sha256, ledger_root: ledger.ledger_root, artifact_files: artifactFiles.length}, null, 2)}\n`);

function readOptionalSourcePackageHash() {
  const file = path.join(evidenceDir, 'source-package-sha256.json');
  return fs.existsSync(file) ? readJson('source-package-sha256.json').sha256 : null;
}
