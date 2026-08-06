import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {rootHash} from '../packages/world/native-visual-genesis-runtime/src/canonical.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const zipFile = path.resolve(option('--out') ?? 'tmp/RNCS-Anime-Forge-v0.1-phase6-native-source.zip');
const stageDir = path.join(path.dirname(zipFile), `${path.basename(zipFile, '.zip')}.source`);
const baseScript = path.join(root, 'scripts', 'package-anime-forge-source.mjs');
const base = spawnSync(process.execPath, [baseScript, '--out', zipFile], {cwd: root, encoding: 'utf8'});
if (base.status !== 0) { process.stdout.write(base.stdout ?? ''); process.stderr.write(base.stderr ?? ''); process.exit(base.status ?? 1); }

const extraRoots = [
  'packages/world/native-visual-genesis-runtime',
  'apps/reality-studio/src/index.mjs',
  'apps/reality-studio/src/server.mjs',
  'apps/reality-studio/src/native-visual-genesis-studio.mjs',
  'apps/reality-studio/tests/native-visual-genesis.test.mjs',
  'apps/reality-studio/web/anime-forge.html',
  'scripts/build-anime-forge-phase6-native-shot.mjs',
  'scripts/verify-anime-forge-phase6-native-evidence.mjs',
  'scripts/package-anime-forge-phase6-native-source.mjs',
  'docs/architecture/adr/ADR-native-visual-render-backend-v0.1.md',
  'docs/verification/anime-forge-phase6-native-visual-v0.1',
  '.github/workflows/anime-forge-phase6-native.yml'
];

function copyExtra(relative) {
  const source = path.join(root, relative);
  const target = path.join(stageDir, relative);
  if (!fs.existsSync(source)) throw new Error(`SOURCE_PACKAGE_FILE_MISSING:${relative}`);
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, {recursive: true});
    for (const entry of fs.readdirSync(source, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) copyExtra(path.join(relative, entry.name));
  } else {
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.copyFileSync(source, target);
  }
}
for (const relative of extraRoots) copyExtra(relative);

const manifestFile = path.join(stageDir, 'source-package-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
manifest.phase = 'phase-6-native-visual-genesis';
manifest.status = 'native-shot-complete-human-review-pending';
manifest.scope = 'RNCS-native Visual Genome, morphogenesis, performance, scene/camera, style laws, CPU 2D/2.5D renderer, feedback repair, Reality Studio workspace, real FFmpeg media closure, evidence and tests';
manifest.next_phase = 'human-visual-acceptance-and-quality-uplift';
manifest.boundaries = {...(manifest.boundaries ?? {}), native_visual: 'experimental RNCS-native procedural visual body; commercial Anime quality is not proven', external_visual: 'external models remain optional compatibility providers and do not own Episode or Character authority', media: 'MP4 bytes are scoped to recorded FFmpeg/ffprobe versions'};
const extraFiles = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(stageDir, absolute).split(path.sep).join('/');
    if (entry.isDirectory()) collect(absolute);
    else if (relative !== 'source-package-manifest.json' && !manifest.files.some(item => item.path === relative)) extraFiles.push(relative);
  }
}
collect(stageDir);
const listedPaths = [...manifest.files.map(item => item.path), ...extraFiles].sort((a, b) => a.localeCompare(b));
manifest.files = listedPaths.map(item => ({path: item, bytes: fs.statSync(path.join(stageDir, item)).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(stageDir, item))).digest('hex')}));
manifest.file_count = manifest.files.length;
manifest.package_root = rootHash({...manifest, package_root: undefined});
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

const crcTable = Array.from({length: 256}, (_, index) => { let value = index; for (let bit = 0; bit < 8; bit++) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1); return value >>> 0; });
const entries = [];
function collectArchive(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(stageDir, absolute).split(path.sep).join('/');
    if (entry.isDirectory()) collectArchive(absolute); else entries.push({name: relative, bytes: fs.readFileSync(absolute)});
  }
}
collectArchive(stageDir);
fs.mkdirSync(path.dirname(zipFile), {recursive: true});
fs.writeFileSync(zipFile, createZip(entries));
const zipSha256 = crypto.createHash('sha256').update(fs.readFileSync(zipFile)).digest('hex');

const evidenceDir = path.resolve(option('--evidence') ?? process.env.RNCS_NATIVE_SHOT_OUT ?? 'evidence/anime-forge-phase6-native-visual-v0.1');
if (fs.existsSync(path.join(evidenceDir, 'native-visual-ledger.json'))) {
  const ledgerFile = path.join(evidenceDir, 'native-visual-ledger.json');
  const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
  ledger.source_package_sha256 = zipSha256;
  ledger.ledger_file_sha256 = rootHash({...ledger, ledger_file_sha256: null, ledger_root: undefined});
  ledger.ledger_internal_root = rootHash({...ledger, ledger_internal_root: null, ledger_file_sha256: null, ledger_root: undefined});
  ledger.ledger_root = rootHash({...ledger, ledger_root: undefined});
  fs.writeFileSync(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);
  fs.writeFileSync(path.join(evidenceDir, 'source-package-sha256.json'), `${JSON.stringify({format: 'rncs.source-package-sha256.v0.1', path: path.relative(root, zipFile).split(path.sep).join('/'), sha256: zipSha256, bytes: fs.statSync(zipFile).size}, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify({ok: true, zip: zipFile, staging: stageDir, phase: manifest.phase, status: manifest.status, file_count: manifest.file_count, package_root: manifest.package_root, zip_sha256: zipSha256}, null, 2)}\n`);

function crc32(bytes) { let value = 0xffffffff; for (const byte of bytes) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }
function createZip(items) {
  const local = [], central = []; let offset = 0; const dosTime = 0, dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const item of items) {
    const name = Buffer.from(item.name, 'utf8'), data = item.bytes, crc = crc32(data), header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6); header.writeUInt16LE(0, 8); header.writeUInt16LE(dosTime, 10); header.writeUInt16LE(dosDate, 12); header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26); header.writeUInt16LE(0, 28); local.push(header, name, data);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x0800, 8); directory.writeUInt16LE(0, 10); directory.writeUInt16LE(dosTime, 12); directory.writeUInt16LE(dosDate, 14); directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(name.length, 28); directory.writeUInt16LE(0, 30); directory.writeUInt16LE(0, 32); directory.writeUInt16LE(0, 34); directory.writeUInt16LE(0, 36); directory.writeUInt32LE(0, 38); directory.writeUInt32LE(offset, 42); central.push(directory, name); offset += header.length + name.length + data.length;
  }
  const centralSize = central.reduce((sum, item) => sum + item.length, 0), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6); end.writeUInt16LE(items.length, 8); end.writeUInt16LE(items.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20); return Buffer.concat([...local, ...central, end]);
}
