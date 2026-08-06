import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {NativeVisualGenesisWorkspace} from '../src/native-visual-genesis-studio.mjs';
import {startStudioServer} from '../src/server.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const rootHash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function fixture({media = false} = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncs-native-visual-workspace-'));
  const write = (name, value) => { const file = path.join(dir, name); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2)); };
  for (const layer of ['frames', 'depth', 'masks', 'lines', 'lights']) { fs.mkdirSync(path.join(dir, layer), {recursive: true}); fs.writeFileSync(path.join(dir, layer, 'frame-000001.png'), png); }
  if (media) { fs.writeFileSync(path.join(dir, 'episode.mp4'), Buffer.from('real-build-is-verified-by-ffprobe-in-the-integration-build')); fs.writeFileSync(path.join(dir, 'episode.wav'), Buffer.from('wav-placeholder-for-workspace-model-test')); }
  const frameFiles = Object.fromEntries(['color', 'depth', 'mask', 'line', 'light'].map((key, index) => [key, `${['frames', 'depth', 'masks', 'lines', 'lights'][index]}/frame-000001.png`]));
  write('frame-manifest.json', {format: 'rncs.native-frame-manifest.v0.1', fps: 24, frames: [{frame_number: 0, time_seconds: 0, phase: 'prep', files: frameFiles, frame_root: rootHash('frame'), state_root: rootHash('state'), motion_vector: {x: 0, y: 0}, occlusion_active: false}]});
  write('phase-status.json', {native_five_second_shot_status: 'passed', visual_uplift_versus_phase4: 'pending-human-review', human_visual_acceptance: 'pending'});
  write('native-visual-ledger.json', {ledger_root: rootHash('ledger'), evidence_bundle_root: rootHash('bundle'), gates: {mp4: true, ffprobe: true}, roots: {character_identity_root: 'identity', body_graph_root: 'body'}});
  write('ffprobe-report.json', {validation: {valid: true}});
  write('provider-manifest.json', {providers: [{provider_id: 'rncs.native-2d25d-cpu', real_media: true, deterministic: true}]});
  write('performance-plan.json', {format: 'rncs.performance-plan.v0.1'});
  write('performance-report.json', {format: 'rncs.performance-report.v0.1'});
  write('repair-receipt.json', {repair_receipt_root: 'repair', changed_frame_range: {start: 0, end: 0}, validation: {valid: true}, identity_roots_unchanged: true, unaffected_frames_preserved: true, before_sequence_root: 'before', after_sequence_root: 'after'});
  write('native-visual-uplift-report.json', {status: 'pending-human-review'});
  return dir;
}

test('Native Visual Genesis workspace fails closed without evidence media', () => {
  const workspace = new NativeVisualGenesisWorkspace({evidenceDir: fixture()});
  const value = workspace.inspect();
  assert.equal(value.first_screen.episode_playable, false);
  assert.equal(value.first_screen.final_media.mp4.exists, false);
  assert.equal(value.controls.play.enabled, false);
  assert.equal(value.controls.rollback.write, false);
});

test('Native Visual Genesis workspace exposes the same authority contract on desktop and mobile', () => {
  const workspace = new NativeVisualGenesisWorkspace({evidenceDir: fixture({media: true})});
  const desktop = workspace.inspect({viewport: 'desktop', disclosure: 'detail', frame: 0, layer: 'color'});
  const mobile = workspace.inspect({viewport: 'mobile', disclosure: 'summary', frame: 0, layer: 'depth'});
  assert.equal(desktop.first_screen.episode_playable, true);
  assert.equal(desktop.controls.frame.max, 0);
  assert.equal(desktop.active_frame.frame.selected_file.path, 'frames/frame-000001.png');
  assert.equal(mobile.viewport, 'mobile');
  assert.equal(mobile.active_frame.frame.selected_file.path, 'depth/frame-000001.png');
  assert.equal(desktop.authority.episode, 'authoritative');
  assert.equal(mobile.authority.cut, 'derived');
  assert.equal(desktop.controls.rollback.write, false);
  assert.equal(desktop.detail.provider_manifest.providers[0].provider_id, 'rncs.native-2d25d-cpu');
  assert.equal(workspace.command('repair-compare').rollback.write, false);
  assert.equal(workspace.command('rollback').write, false);
});

test('Reality Studio serves native workspace evidence and bounded layer assets', async () => {
  const evidenceDir = fixture({media: true});
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rncs-native-visual-studio-server-'));
  const started = await startStudioServer({port: 0, dataDir, nativeVisualEvidenceDir: evidenceDir});
  try {
    const response = await fetch(`${started.url}/api/anime-forge/native-visual-workspace?disclosure=detail&frame=0&layer=line&viewport=mobile`);
    const value = await response.json();
    assert.equal(response.status, 200);
    assert.equal(value.ok, true);
    assert.equal(value.viewport, 'mobile');
    assert.equal(value.first_screen.episode_playable, true);
    assert.equal(value.active_frame.frame.layer, 'line');
    const asset = await fetch(`${started.url}/api/anime-forge/native-visual-workspace/asset?path=${encodeURIComponent('lines/frame-000001.png')}`);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get('content-type'), 'image/png');
    assert.equal(Buffer.from(await asset.arrayBuffer()).equals(png), true);
    const blocked = await fetch(`${started.url}/api/anime-forge/native-visual-workspace/asset?path=${encodeURIComponent('../package.json')}`);
    assert.equal(blocked.status, 500);
  } finally {
    await new Promise(resolve => started.server.close(resolve));
  }
});
