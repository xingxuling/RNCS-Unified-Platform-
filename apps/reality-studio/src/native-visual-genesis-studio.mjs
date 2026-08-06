import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const FORMAT = 'reality-studio.native-visual-genesis-workspace.v0.1';
const PHASE = 'phase-6-native-visual-genesis';
const LAYERS = ['color', 'depth', 'mask', 'line', 'light'];
const readJson = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const unique = values => [...new Set(values.filter(Boolean))];
const relative = (root, file) => path.relative(root, file).split(path.sep).join('/');

function rootInside(root, file) {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(file);
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(`${resolvedRoot}${path.sep}`);
}

function statusFailures(phaseStatus, ledger) {
  const failures = [];
  for (const [key, value] of Object.entries(phaseStatus ?? {})) {
    if (key.endsWith('_status') && value === 'failed') failures.push(key);
  }
  for (const [key, value] of Object.entries(ledger?.gates ?? {})) {
    if (value === false) failures.push(`gate:${key}`);
  }
  return unique(failures);
}

function cleanFileRecord(root, value) {
  if (!value) return null;
  const file = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (!rootInside(root, file)) return null;
  return {path: relative(root, file), exists: fs.existsSync(file), sha256: fs.existsSync(file) ? sha256(file) : null};
}

export class NativeVisualGenesisWorkspace {
  constructor({evidenceDir} = {}) {
    if (!evidenceDir) throw new Error('NATIVE_VISUAL_EVIDENCE_DIR_REQUIRED');
    this.evidence_dir = path.resolve(evidenceDir);
  }

  file(name) {
    const file = path.resolve(this.evidence_dir, name);
    if (!rootInside(this.evidence_dir, file)) throw Object.assign(new Error('NATIVE_VISUAL_ASSET_OUTSIDE_EVIDENCE'), {code: 'NATIVE_VISUAL_ASSET_OUTSIDE_EVIDENCE'});
    return file;
  }

  report(name) {
    return readJson(this.file(name));
  }

  available() {
    return fs.existsSync(this.evidence_dir) && fs.existsSync(this.file('frame-manifest.json'));
  }

  firstScreen({phaseStatus, ledger, probe, provider, uplift} = {}) {
    const failures = statusFailures(phaseStatus, ledger);
    const playable = phaseStatus?.native_five_second_shot_status === 'passed' && ledger?.gates?.mp4 === true && ledger?.gates?.ffprobe === true && probe?.validation?.valid === true && fs.existsSync(this.file('episode.mp4')) && fs.existsSync(this.file('episode.wav'));
    return {
      status: playable ? 'playable-experimental' : 'blocked',
      episode_playable: playable,
      failures,
      final_media: {
        mp4: cleanFileRecord(this.evidence_dir, 'episode.mp4'),
        wav: cleanFileRecord(this.evidence_dir, 'episode.wav'),
        ffprobe_valid: probe?.validation?.valid === true
      },
      native_provider: provider?.providers?.find(item => item.provider_id === 'rncs.native-2d25d-cpu') ?? null,
      visual_uplift: phaseStatus?.visual_uplift_versus_phase4 ?? uplift?.status ?? 'unmeasured',
      human_visual_acceptance: phaseStatus?.human_visual_acceptance ?? 'pending',
      next_human_judgement: playable
        ? '审看角色身份、脸部可读性、动作节奏、镜头空间和 Phase 4 对照；自动结构检查不能替代人工选片。'
        : '先处理首个失败媒体门；不得把未生成的媒体当作可播放结果。',
      boundary: 'Episode Intent is authoritative. This workspace is read-only evidence inspection; commercial Anime quality is not proven.'
    };
  }

  frame({frameNumber = 0, layer = 'color'} = {}) {
    const manifest = this.report('frame-manifest.json');
    if (!manifest) return {status: 'blocked', code: 'NATIVE_FRAME_MANIFEST_MISSING', frame: null};
    const index = Number.isFinite(Number(frameNumber)) ? Math.max(0, Math.round(Number(frameNumber))) : 0;
    const record = manifest.frames?.find(item => item.frame_number === index) ?? manifest.frames?.[Math.min(index, Math.max(0, (manifest.frames?.length ?? 1) - 1))];
    if (!record) return {status: 'blocked', code: 'NATIVE_FRAME_NOT_FOUND', frame: null};
    const selectedLayer = LAYERS.includes(layer) ? layer : 'color';
    const files = Object.fromEntries(Object.entries(record.files ?? {}).map(([key, value]) => [key, cleanFileRecord(this.evidence_dir, value)]));
    const selected = files[selectedLayer === 'color' ? 'color' : selectedLayer];
    return {
      status: selected?.exists ? 'ready' : 'blocked',
      frame: {
        frame_number: record.frame_number,
        time_seconds: record.time_seconds,
        phase: record.phase,
        layer: selectedLayer,
        selected_file: selected,
        files,
        motion_vector: record.motion_vector,
        occlusion_active: record.occlusion_active,
        frame_root: record.frame_root,
        state_root: record.state_root,
        body_graph_root: record.body_graph_root,
        performance_frame_root: record.performance_frame_root,
        scene_frame_root: record.scene_frame_root,
        style_root: record.style_root
      }
    };
  }

  inspect({disclosure = 'summary', frame = 0, layer = 'color', viewport = 'desktop'} = {}) {
    if (!this.available()) {
      return {
        format: FORMAT,
        version: '0.1.0-alpha.1',
        phase: PHASE,
        status: 'blocked',
        evidence_dir: this.evidence_dir,
        first_screen: {status: 'blocked', episode_playable: false, failures: ['NATIVE_EVIDENCE_NOT_FOUND'], final_media: {mp4: null, wav: null, ffprobe_valid: false}, next_human_judgement: '先构建 Native Visual Genesis 证据包。', boundary: 'No static placeholder is treated as final media.'},
        controls: {play: {enabled: false}, frame: {enabled: false}, overlays: Object.fromEntries(LAYERS.map(item => [item, {enabled: false}])), motion: {enabled: false}, repair_compare: {enabled: false}, rollback: {enabled: false, write: false}},
        evidence: {available: false, required: ['phase-status.json', 'frame-manifest.json', 'provider-manifest.json', 'native-visual-ledger.json', 'episode.mp4', 'episode.wav']}
      };
    }
    const phaseStatus = this.report('phase-status.json');
    const ledger = this.report('native-visual-ledger.json');
    const probe = this.report('ffprobe-report.json');
    const provider = this.report('provider-manifest.json');
    const manifest = this.report('frame-manifest.json');
    const uplift = this.report('native-visual-uplift-report.json');
    const repair = this.report('repair-receipt.json');
    const residual = this.report('residual-report.json');
    const firstScreen = this.firstScreen({phaseStatus, ledger, probe, provider, uplift});
    const currentFrame = this.frame({frameNumber: frame, layer});
    const controls = {
      play: {enabled: firstScreen.episode_playable, asset: cleanFileRecord(this.evidence_dir, 'episode.mp4')},
      frame: {enabled: Boolean(manifest?.frames?.length), min: 0, max: Math.max(0, (manifest?.frames?.length ?? 1) - 1), current: currentFrame.frame?.frame_number ?? 0},
      overlays: Object.fromEntries(LAYERS.map(item => [item, {enabled: Boolean(currentFrame.frame?.files?.[item]?.exists), selected: item === (currentFrame.frame?.layer ?? 'color')} ])),
      motion: {enabled: Boolean(this.report('performance-plan.json')), track: 'gaze/head/shoulder/weight/breath/hair/costume'},
      repair_compare: {enabled: Boolean(repair?.repair_receipt_root), frame_range: repair?.changed_frame_range ?? repair?.scope ?? null},
      rollback: {enabled: Boolean(repair?.repair_receipt_root), write: false, mode: 'preview-only', target: 'base-frame-sequence'}
    };
    const base = {
      format: FORMAT,
      version: '0.1.0-alpha.1',
      phase: PHASE,
      status: firstScreen.status,
      authority: {episode: 'authoritative', cut: 'derived', clip: 'reusable', patch: 'local', continuity: 'global', studio_write_authority: 'read-only-inspection'},
      viewport: viewport === 'mobile' ? 'mobile' : 'desktop',
      evidence_dir: this.evidence_dir,
      first_screen: firstScreen,
      controls,
      active_frame: currentFrame,
      evidence: {available: true, ledger_root: ledger?.ledger_root ?? null, evidence_bundle_root: ledger?.evidence_bundle_root ?? null, files: ['episode.mp4', 'episode.wav', 'frame-manifest.json', 'provider-manifest.json', 'character-continuity-report.json', 'cut-continuity-report.json', 'ffprobe-report.json', 'native-visual-ledger.json'].map(name => ({path: name, exists: fs.existsSync(this.file(name))}))}
    };
    if (disclosure !== 'detail') return base;
    return {
      ...base,
      detail: {
        phase_status: phaseStatus,
        provider_manifest: provider,
        asset_lineage: {character_identity_root: ledger?.roots?.character_identity_root, visual_genome_root: ledger?.roots?.visual_genome_root, body_graph_root: ledger?.roots?.body_graph_root, topology_root: ledger?.roots?.topology_root, skeleton_root: ledger?.roots?.skeleton_root, facial_rig_root: ledger?.roots?.facial_rig_root, hair_rig_root: ledger?.roots?.hair_rig_root, costume_rig_root: ledger?.roots?.costume_rig_root},
        performance: this.report('performance-plan.json'),
        scene_camera: this.report('scene-field.json'),
        style_law: this.report('style-law-set.json'),
        render_plan: this.report('native-render-plan.json'),
        character_continuity: this.report('character-continuity-report.json'),
        cut_continuity: this.report('cut-continuity-report.json'),
        audio_video_sync: this.report('audio-video-sync-report.json') ?? {status: probe?.validation?.valid === true ? 'pass-derived-from-ffprobe' : 'pending', source: 'ffprobe-report.json'},
        secondary_motion: this.report('performance-report.json'),
        residual_report: residual,
        repair_receipt: repair,
        repair_comparison: this.repairComparison(),
        uplift_report: uplift,
        ledger,
        probe
      }
    };
  }

  repairComparison() {
    const receipt = this.report('repair-receipt.json');
    if (!receipt) return {status: 'unavailable', write: false};
    return {status: receipt.validation?.valid === true ? 'ready' : 'blocked', changed_frame_range: receipt.changed_frame_range ?? receipt.scope ?? null, before_sequence_root: receipt.before_sequence_root ?? null, after_sequence_root: receipt.after_sequence_root ?? null, identity_roots_unchanged: receipt.identity_roots_unchanged === true || (receipt.roots_unchanged?.episode_intent === true && receipt.roots_unchanged?.character_identity === true), unaffected_frames_preserved: receipt.unaffected_frames_preserved === true || receipt.validation?.unaffected_frames_preserved === true, rollback: {enabled: true, write: false, target: 'base-frame-sequence', reason: 'restore and re-render from Episode Intent; Studio cannot commit a local patch into Episode'}};
  }

  command(command = 'inspect', options = {}) {
    if (command === 'inspect') return this.inspect(options);
    if (command === 'frame') return this.frame(options);
    if (command === 'repair-compare') return this.repairComparison();
    if (command === 'rollback') return {status: 'preview-only', ok: true, write: false, authority: 'read-only-inspection', target: 'base-frame-sequence', next_action: 'Rebuild from Episode Intent after authorized repair decision.'};
    throw Object.assign(new Error(`NATIVE_VISUAL_WORKSPACE_COMMAND_UNKNOWN:${command}`), {code: 'NATIVE_VISUAL_WORKSPACE_COMMAND_UNKNOWN'});
  }

  asset(relativePath) {
    const normalized = String(relativePath ?? '').replaceAll('\\', '/').replace(/^\/+/, '');
    const allowedReports = new Set(['native-visual-ledger.json', 'phase6-verification-report.json', 'provider-manifest.json', 'ffprobe-report.json', 'audio-video-sync-report.json', 'SHA256SUMS.txt', 'SHA256SUMS.json']);
    const allowed = normalized === 'episode.mp4' || normalized === 'episode.wav' || normalized === 'phase4-phase6-contact-sheet.png' || normalized === 'phase6-native-frame-start.png' || normalized === 'phase6-native-frame-action.png' || normalized === 'phase6-native-frame-settle.png' || allowedReports.has(normalized) || /^(frames|depth|masks|lines|lights)\/frame-\d{6}\.png$/u.test(normalized);
    if (!allowed) throw Object.assign(new Error('NATIVE_VISUAL_ASSET_NOT_EXPOSED'), {code: 'NATIVE_VISUAL_ASSET_NOT_EXPOSED'});
    const file = this.file(normalized);
    if (!fs.existsSync(file)) throw Object.assign(new Error('NATIVE_VISUAL_ASSET_MISSING'), {code: 'NATIVE_VISUAL_ASSET_MISSING'});
    return file;
  }
}

export function createNativeVisualGenesisWorkspace(options) {
  return new NativeVisualGenesisWorkspace(options);
}
