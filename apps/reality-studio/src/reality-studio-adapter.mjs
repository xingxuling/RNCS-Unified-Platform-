import { randomUUID } from 'node:crypto';
import { rootHash as rfeRootHash } from '@taowind/rfe-core-sdk';
import {
  RealityNetworkRuntime,
  verifyNetworkWorldCompilationEnvelope,
} from '@taowind/reality-network-runtime';
import {
  createBranch,
  createWorkspace,
  simulateBranch,
  compareBranches,
  createMergeProposal,
  createAuthorityRequest,
} from '@taowind/reality-branch-fabric';
import {
  compileStudioWorldBodyCandidate,
  verifyStudioWorldBodyCandidate,
  summarizeStudioWorldBodyCandidate,
} from '@taowind/world-body-studio-bridge';
import { createStudioNetworkWorld } from '../../../examples/studio-authored-network-world-v03/project.mjs';
import {
  renderNetworkAssetViewport,
  verifyNetworkWorldCompilation,
} from './network-world-compiler.mjs';
import { BehaviorEditorSession } from './behavior-studio.mjs';

export const REALITY_STUDIO_ADAPTER_FORMAT = 'taowind.reality-studio-adapter.v0.1';
export const REALITY_STUDIO_ADAPTER_VERSION = '0.1.0-alpha.1';
export const REALITY_STUDIO_EVIDENCE_FORMAT = 'taowind.reality-studio-evidence-ledger.v0.1';
export const REALITY_STUDIO_GRAPH_FORMAT = 'taowind.reality-studio-reality-graph.v0.1';
export const REALITY_STUDIO_INTEGRATED_TIMELINE_FORMAT = 'taowind.reality-studio-integrated-runtime-timeline.v0.1';
export const REALITY_STUDIO_INTEGRATED_REPLAY_FORMAT = 'taowind.reality-studio-integrated-runtime-replay.v0.1';
export const REALITY_STUDIO_GAME_CAPABILITIES_FORMAT = 'taowind.reality-studio-game-capabilities.v0.1';

const FIXED_TIME = '2026-07-18T00:00:00.000Z';
const ZERO_ROOT = '0'.repeat(64);
const clone = value => structuredClone(value);
const NETWORK_DEFAULTS = Object.freeze({
  seed: 37,
  fixedLatencyTicks: 0,
  jitterTicks: 0,
  lossRatePpm: 0,
  duplicateRatePpm: 0,
  reorderRatePpm: 0,
});

const GRAPH_LAYOUT = Object.freeze({
  'data-source': { x: 7, y: 23 },
  'semantic-compiler': { x: 25, y: 23 },
  'studio-adapter': { x: 43, y: 23 },
  'reality-kernel': { x: 62, y: 11 },
  'world-body': { x: 62, y: 34 },
  'rsr-runtime': { x: 79, y: 23 },
  'commit-gate': { x: 79, y: 43 },
  'vsr-projection': { x: 94, y: 23 },
  'candidate-reality': { x: 43, y: 68 },
  'behavior-fabric': { x: 62, y: 68 },
  'evidence-ledger': { x: 62, y: 87 },
  'network-runtime': { x: 79, y: 87 },
  'authority-fabric': { x: 94, y: 87 },
  'agent-hub': { x: 43, y: 87 },
});

const GRAPH_EDGES = Object.freeze([
  { from: 'data-source', to: 'semantic-compiler', kind: 'source' },
  { from: 'semantic-compiler', to: 'studio-adapter', kind: 'projection' },
  { from: 'studio-adapter', to: 'reality-kernel', kind: 'projection' },
  { from: 'reality-kernel', to: 'rsr-runtime', kind: 'runtime' },
  { from: 'reality-kernel', to: 'world-body', kind: 'candidate' },
  { from: 'world-body', to: 'commit-gate', kind: 'candidate' },
  { from: 'rsr-runtime', to: 'commit-gate', kind: 'runtime' },
  { from: 'rsr-runtime', to: 'vsr-projection', kind: 'projection' },
  { from: 'studio-adapter', to: 'candidate-reality', kind: 'candidate' },
  { from: 'candidate-reality', to: 'commit-gate', kind: 'authority' },
  { from: 'candidate-reality', to: 'behavior-fabric', kind: 'candidate' },
  { from: 'behavior-fabric', to: 'evidence-ledger', kind: 'evidence' },
  { from: 'network-runtime', to: 'authority-fabric', kind: 'authority' },
  { from: 'rsr-runtime', to: 'network-runtime', kind: 'runtime' },
  { from: 'evidence-ledger', to: 'commit-gate', kind: 'evidence' },
  { from: 'agent-hub', to: 'candidate-reality', kind: 'unavailable' },
]);

export class RealityStudioAdapterError extends Error {
  constructor(code, message = '', details = {}) {
    super(`${code}${message ? `: ${message}` : ''}`);
    this.name = 'RealityStudioAdapterError';
    this.code = code;
    this.details = details;
  }
}

const fail = (code, message, details = {}) => {
  throw new RealityStudioAdapterError(code, message, details);
};

const boundedTicks = value => Math.max(1, Math.min(120, Math.round(Number(value) || 1)));

const root = value => rfeRootHash(value);

function graphNode({ id, title, subtitle, owner, status, format = null, version = null, api = null, source = null, rootValue = null, metrics = {}, evidenceRefs = [], gaps = [] }) {
  const position = GRAPH_LAYOUT[id] ?? { x: 50, y: 50 };
  return {
    id,
    title,
    subtitle,
    owner,
    status,
    format,
    version,
    api,
    source,
    root: rootValue,
    metrics,
    evidence_refs: evidenceRefs,
    gaps,
    position,
  };
}

function rootSummary(value) {
  if (typeof value !== 'string') return null;
  return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

export class RealityStudioAdapter {
  static async create(options = {}) {
    const adapter = new RealityStudioAdapter(options);
    await adapter.init();
    return adapter;
  }

  constructor({ sessionId = null, transportProfile = {}, clock = () => FIXED_TIME } = {}) {
    this.session_id = String(sessionId ?? `reality-studio:${randomUUID()}`);
    this.clock = clock;
    this.transport_profile = { ...NETWORK_DEFAULTS, ...clone(transportProfile) };
    this.status = 'initializing';
    this.control_mode = 'paused';
    this.runtime_serial = 0;
    this.event_sequence = 0;
    this.events = [];
    this.snapshots = [];
    this.selected_node_id = 'reality-kernel';
    this.candidate = null;
    this.last_replay = null;
    this.last_snapshot = null;
    this.last_viewport = null;
    this.last_asset_streaming = null;
    this.joined_slots = [];
    this.network_runtime = null;
    this.network_session_id = null;
    this.network_envelope = null;
    this.network_snapshot = null;
    this.network_health = null;
    this.compilation = null;
    this.compilation_verification = null;
    this.world_body_candidate = null;
    this.world_body_verification = false;
    this.world_body_summary = null;
    this.branch_evaluation = null;
    this.session = null;
    this.integration_epochs = [];
    this.integration_epoch_serial = 0;
    this.active_integration_epoch_id = null;
  }

  async init() {
    const authored = createStudioNetworkWorld({ transport: this.transport_profile });
    this.session = authored.session;
    this.compilation = authored.compilation;
    this.compilation_verification = this._verifyCompilation(this.compilation);
    if (!this.compilation_verification.valid) {
      fail('STUDIO_ADAPTER_COMPILATION_INVALID', 'The existing Studio network compilation did not verify', this.compilation_verification);
    }
    this._refreshProjectArtifacts();
    await this._openNetworkRuntime('bootstrap');
    await this._refreshViewport({ record: false });
    this._startIntegrationEpoch('bootstrap');
    this.status = 'ready';
    this.record('studio-adapter.ready', {
      project_root: this.compilation.project_root,
      compilation_root: this.compilation.compilation_root,
      network_session_id: this.network_session_id,
      viewport_root: this.last_viewport?.viewport_root ?? null,
    });
    return this;
  }

  _verifyCompilation(compilation) {
    const local = verifyNetworkWorldCompilation(compilation);
    const runtime = verifyNetworkWorldCompilationEnvelope(compilation);
    return {
      valid: local.valid && runtime.valid,
      local,
      runtime,
      errors: [...(local.errors ?? []), ...(runtime.errors ?? [])],
    };
  }

  _refreshProjectArtifacts() {
    this.compilation = this.session.networkCompile();
    this.compilation_verification = this._verifyCompilation(this.compilation);
    if (!this.compilation_verification.valid) {
      fail('STUDIO_ADAPTER_COMPILATION_INVALID', 'The current Unified Project cannot be compiled into a verified network world', this.compilation_verification);
    }
    this.world_body_candidate = compileStudioWorldBodyCandidate(this.session.project, {
      networkCompilation: this.compilation,
    });
    this.world_body_verification = verifyStudioWorldBodyCandidate(this.world_body_candidate);
    this.world_body_summary = summarizeStudioWorldBodyCandidate(this.world_body_candidate);
    if (!this.world_body_verification) {
      fail('STUDIO_ADAPTER_WORLD_BODY_CANDIDATE_INVALID', 'The reused World Body Bridge candidate did not verify');
    }
  }

  async _openNetworkRuntime(reason) {
    this.runtime_serial += 1;
    this.network_session_id = `${this.session_id}:network:${this.runtime_serial}`;
    this.network_runtime = new RealityNetworkRuntime();
    await this.network_runtime.createSessionFromCompilation({
      sessionId: this.network_session_id,
      compilation: this.compilation,
      clock: this.clock,
    });
    this.joined_slots = [];
    for (const slot of this.compilation.player_slots ?? []) {
      const joined = await this.network_runtime.joinCompiledSlot({
        sessionId: this.network_session_id,
        slotId: slot.slot_id,
        subjectId: slot.subject_id,
      });
      this.joined_slots.push({
        slot_id: slot.slot_id,
        player_id: joined.playerId,
        subject_id: slot.subject_id,
        character_id: slot.character_id,
        body_id: slot.body_id,
        delegation_root: joined.delegation?.delegation_root ?? null,
      });
    }
    this._syncNetwork(reason);
    this.record('network-runtime.opened', {
      reason,
      session_id: this.network_session_id,
      compilation_root: this.compilation.compilation_root,
      players: this.network_health?.server?.players ?? 0,
      state_root: this.network_health?.server?.stateRoot ?? null,
    });
  }

  _syncNetwork(reason = 'inspect') {
    if (!this.network_runtime || !this.network_session_id) return;
    this.network_envelope = this.network_runtime.pullSnapshot({
      sessionId: this.network_session_id,
      reason,
    });
    this.network_snapshot = this.network_envelope.rsrSnapshot;
    this.network_health = this.network_runtime.getSessionHealth({ sessionId: this.network_session_id });
  }

  async _refreshViewport({ record = true } = {}) {
    if (!this.network_snapshot) return null;
    this.last_viewport = await renderNetworkAssetViewport({
      project: this.session.project,
      compilation: this.compilation,
      snapshot: this.network_snapshot,
      width: 640,
      height: 360,
      qualityTier: 'balanced',
    });
    if (record) {
      this.record('vsr.viewport.rendered', {
        frame_root: this.last_viewport.frame_root,
        pixel_root: this.last_viewport.pixel_root,
        viewport_root: this.last_viewport.viewport_root,
        source_state_root: this.last_viewport.source_state_root,
        frame_verified: this.last_viewport.frame_verified === true,
      });
    }
    return this.last_viewport;
  }

  async _rebuildRuntime(reason) {
    this._refreshProjectArtifacts();
    await this._openNetworkRuntime(reason);
    await this._refreshViewport({ record: false });
    this._startIntegrationEpoch(reason);
    this.record('studio-adapter.runtime-rebuilt', {
      reason,
      compilation_root: this.compilation.compilation_root,
      viewport_root: this.last_viewport?.viewport_root ?? null,
    });
  }

  _activeIntegrationEpoch() {
    return this.integration_epochs.find(epoch => epoch.epoch_id === this.active_integration_epoch_id) ?? null;
  }

  _integrationEntryView(entry) {
    return {
      sequence: entry.sequence,
      epoch_tick: entry.epoch_tick,
      behavior_tick: entry.behavior_tick,
      network_tick: entry.network_tick,
      behavior_offset: entry.behavior_offset,
      network_offset: entry.network_offset,
      tick_aligned: entry.tick_aligned,
      behavior_input_root: entry.behavior_input_root,
      network_input_packet_root: entry.network_input_packet_root,
      network_input_present: entry.network_input_present,
      behavior_state_root: entry.behavior_state_root,
      network_state_root: entry.network_state_root,
      network_receipt_root: entry.network_receipt_root,
      status: entry.status,
      entry_root: entry.entry_root,
    };
  }

  _integrationTimelineRoot(epoch) {
    if (!epoch) return null;
    return root({
      format: REALITY_STUDIO_INTEGRATED_TIMELINE_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      epoch_id: epoch.epoch_id,
      epoch_root: epoch.epoch_root,
      entry_roots: epoch.entries.map(entry => entry.entry_root),
    });
  }

  _integrationEpochView(epoch = this._activeIntegrationEpoch()) {
    if (!epoch) {
      return {
        status: 'unavailable',
        reason: 'No integration epoch has been opened by the current adapter runtime.',
        entry_count: 0,
        timeline_root: null,
      };
    }
    const entries = epoch.entries.map(entry => this._integrationEntryView(entry));
    const tickAligned = entries.every(entry => entry.tick_aligned === true);
    return {
      format: REALITY_STUDIO_INTEGRATED_TIMELINE_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      authority: 'adapter-evidence-only-no-canonical-shared-runtime-owner',
      scope: 'behavior-network-relative-epoch',
      status: tickAligned ? 'recorded' : 'failed',
      epoch_id: epoch.epoch_id,
      epoch_root: epoch.epoch_root,
      reason: epoch.reason,
      project_root: epoch.project_root,
      compilation_root: epoch.compilation_root,
      behavior_program_root: epoch.behavior_program_root,
      behavior_base_tick: epoch.behavior_base_tick,
      behavior_base_state_root: epoch.behavior_base_state_root,
      behavior_snapshot_root: epoch.behavior_snapshot_root,
      network_session_id: epoch.network_session_id,
      network_base_tick: epoch.network_base_tick,
      network_base_state_root: epoch.network_base_state_root,
      network_checkpoint_root: epoch.network_checkpoint_root,
      entry_count: entries.length,
      last_epoch_tick: entries.at(-1)?.epoch_tick ?? 0,
      tick_aligned: tickAligned,
      timeline_root: this._integrationTimelineRoot(epoch),
      entries,
    };
  }

  _startIntegrationEpoch(reason = 'runtime-opened') {
    if (!this.session?.behavior || !this.network_runtime || !this.network_session_id || !this.compilation) return null;
    const behaviorSnapshot = clone(this.session.behavior.runtime.snapshot());
    const networkCheckpoint = clone(this.network_runtime.createCheckpoint({ sessionId: this.network_session_id }));
    const base = {
      format: REALITY_STUDIO_INTEGRATED_TIMELINE_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      epoch_id: `integration-epoch:${this.session_id}:${++this.integration_epoch_serial}`,
      reason: String(reason),
      project_root: this.compilation.project_root,
      compilation_root: this.compilation.compilation_root,
      behavior_program_root: this.session.behavior.program.program_root,
      behavior_base_tick: behaviorSnapshot.tick,
      behavior_base_state_root: this.session.behavior.runtime.stateRoot(),
      behavior_snapshot_root: behaviorSnapshot.snapshot_root,
      network_session_id: this.network_session_id,
      network_base_tick: networkCheckpoint.tick,
      network_base_state_root: networkCheckpoint.stateRoot,
      network_checkpoint_root: networkCheckpoint.checkpointRoot,
    };
    const epoch = {
      ...base,
      epoch_root: root(base),
      behavior_snapshot: behaviorSnapshot,
      behavior_program: clone(this.session.behavior.program),
      network_checkpoint: networkCheckpoint,
      compilation: clone(this.compilation),
      entries: [],
    };
    this.integration_epochs.push(epoch);
    if (this.integration_epochs.length > 20) this.integration_epochs.shift();
    this.active_integration_epoch_id = epoch.epoch_id;
    this.last_replay = null;
    this.record('runtime.integration-epoch-started', {
      epoch_id: epoch.epoch_id,
      epoch_root: epoch.epoch_root,
      reason: epoch.reason,
      behavior_snapshot_root: epoch.behavior_snapshot_root,
      network_checkpoint_root: epoch.network_checkpoint_root,
    });
    return epoch;
  }

  _appendIntegrationEntry({ behaviorInput = {}, networkInputPacket = null, behavior, networkResult }) {
    const epoch = this._activeIntegrationEpoch() ?? this._startIntegrationEpoch('late-binding');
    if (!epoch) fail('STUDIO_INTEGRATION_EPOCH_UNAVAILABLE', 'Behavior and Network Runtime snapshots are required before recording a unified adapter tick');
    const behaviorRuntime = behavior?.behavior?.runtime ?? this.session.behavior.inspect().runtime;
    const networkSnapshot = networkResult?.snapshot ?? this.network_snapshot ?? {};
    const behaviorOffset = Number(behaviorRuntime.tick) - Number(epoch.behavior_base_tick);
    const networkOffset = Number(networkSnapshot.tick ?? this.network_health?.server?.tick) - Number(epoch.network_base_tick);
    const entryBase = {
      format: 'taowind.reality-studio-integrated-runtime-entry.v0.1',
      version: REALITY_STUDIO_ADAPTER_VERSION,
      epoch_id: epoch.epoch_id,
      sequence: epoch.entries.length + 1,
      behavior_input_root: root(behaviorInput ?? {}),
      network_input_packet_root: networkInputPacket ? root(networkInputPacket) : null,
      network_input_present: Boolean(networkInputPacket),
      behavior_tick: behaviorRuntime.tick,
      network_tick: networkSnapshot.tick ?? this.network_health?.server?.tick ?? null,
      behavior_offset: behaviorOffset,
      network_offset: networkOffset,
      epoch_tick: behaviorOffset === networkOffset ? behaviorOffset : null,
      tick_aligned: behaviorOffset === networkOffset,
      behavior_state_root: behaviorRuntime.state_root,
      network_state_root: networkSnapshot.stateRoot ?? this.network_health?.server?.stateRoot ?? null,
      network_receipt_root: networkSnapshot.serverReceiptRoot ?? null,
    };
    const entry = {
      ...entryBase,
      status: entryBase.tick_aligned ? 'recorded' : 'failed',
      entry_root: root(entryBase),
      replay_input: {
        behavior_input: clone(behaviorInput ?? {}),
        network_input_packet: networkInputPacket ? clone(networkInputPacket) : null,
      },
    };
    epoch.entries.push(entry);
    return {
      entry: this._integrationEntryView(entry),
      timeline: this._integrationEpochView(epoch),
    };
  }

  async _replayIntegratedRuntime({ toTick = null, verify = true } = {}) {
    const epoch = this._activeIntegrationEpoch();
    if (!epoch) fail('STUDIO_INTEGRATION_EPOCH_UNAVAILABLE', 'No integration epoch is available for replay');
    const targetEpochTick = toTick === null || toTick === undefined
      ? epoch.entries.at(-1)?.epoch_tick ?? 0
      : Math.max(0, Math.round(Number(toTick) || 0));
    const entries = epoch.entries.filter(entry => entry.epoch_tick !== null && entry.epoch_tick <= targetEpochTick);
    const activeBefore = {
      behavior_tick: this.session.behavior.runtime.state.tick,
      behavior_state_root: this.session.behavior.runtime.stateRoot(),
      network_tick: this.network_health?.server?.tick ?? null,
      network_state_root: this.network_health?.server?.stateRoot ?? null,
    };
    const behaviorReplay = new BehaviorEditorSession(clone(epoch.behavior_program), {
      sessionId: `replay:${this.session_id}:${epoch.epoch_id}`,
    });
    behaviorReplay.runtime.restore(clone(epoch.behavior_snapshot));
    const networkReplay = new RealityNetworkRuntime();
    await networkReplay.createSessionFromCheckpoint({
      checkpoint: clone(epoch.network_checkpoint),
      compilation: clone(epoch.compilation),
      clock: this.clock,
    });
    const checks = [];
    let finalNetworkResult = null;
    for (const entry of entries) {
      const behaviorResult = behaviorReplay.step(clone(entry.replay_input.behavior_input));
      let submission = { status: 'not-submitted', accepted: null, root: null };
      if (entry.replay_input.network_input_packet) {
        try {
          const submitted = networkReplay.submitInputPacket({
            sessionId: epoch.network_session_id,
            input: clone(entry.replay_input.network_input_packet),
          });
          submission = {
            status: submitted?.accepted === true ? 'accepted' : 'rejected',
            accepted: submitted?.accepted === true,
            root: root(submitted ?? null),
          };
        } catch (error) {
          submission = {
            status: 'failed',
            accepted: false,
            root: root({ name: error?.name ?? 'Error', message: error?.message ?? String(error) }),
          };
        }
      }
      let networkResult = null;
      let networkError = null;
      try {
        networkResult = networkReplay.advanceServerTick({ sessionId: epoch.network_session_id, ticks: 1 });
        finalNetworkResult = networkResult;
      } catch (error) {
        networkError = { name: error?.name ?? 'Error', message: error?.message ?? String(error) };
      }
      const actualBehaviorTick = behaviorResult.runtime.tick;
      const actualNetworkTick = networkResult?.snapshot?.tick ?? null;
      const entryIntegrityRoot = root({
        format: entry.format,
        version: entry.version,
        epoch_id: entry.epoch_id,
        sequence: entry.sequence,
        behavior_input_root: entry.behavior_input_root,
        network_input_packet_root: entry.network_input_packet_root,
        network_input_present: entry.network_input_present,
        behavior_tick: entry.behavior_tick,
        network_tick: entry.network_tick,
        behavior_offset: entry.behavior_offset,
        network_offset: entry.network_offset,
        epoch_tick: entry.epoch_tick,
        tick_aligned: entry.tick_aligned,
        behavior_state_root: entry.behavior_state_root,
        network_state_root: entry.network_state_root,
        network_receipt_root: entry.network_receipt_root,
      });
      const checkBase = {
        sequence: entry.sequence,
        epoch_tick: entry.epoch_tick,
        expected_behavior_state_root: entry.behavior_state_root,
        actual_behavior_state_root: behaviorResult.runtime.state_root,
        expected_network_state_root: entry.network_state_root,
        actual_network_state_root: networkResult?.snapshot?.stateRoot ?? null,
        expected_network_receipt_root: entry.network_receipt_root,
        actual_network_receipt_root: networkResult?.snapshot?.serverReceiptRoot ?? null,
        expected_behavior_tick: entry.behavior_tick,
        actual_behavior_tick: actualBehaviorTick,
        expected_network_tick: entry.network_tick,
        actual_network_tick: actualNetworkTick,
        expected_entry_root: entry.entry_root,
        actual_entry_root: entryIntegrityRoot,
        entry_integrity_match: entryIntegrityRoot === entry.entry_root,
        submission,
        network_error: networkError,
      };
      const check = {
        ...checkBase,
        behavior_match: checkBase.actual_behavior_state_root === checkBase.expected_behavior_state_root,
        network_match: checkBase.actual_network_state_root === checkBase.expected_network_state_root,
        receipt_match: checkBase.actual_network_receipt_root === checkBase.expected_network_receipt_root,
        behavior_tick_match: checkBase.actual_behavior_tick === checkBase.expected_behavior_tick,
        network_tick_match: checkBase.actual_network_tick === checkBase.expected_network_tick,
        submission_match: entry.network_input_present ? submission.accepted === true : submission.status === 'not-submitted',
      };
      check.match = check.behavior_match && check.network_match && check.receipt_match && check.behavior_tick_match && check.network_tick_match && check.entry_integrity_match && check.submission_match && !check.network_error;
      check.check_root = root(checkBase);
      checks.push(check);
    }
    const activeAfter = {
      behavior_tick: this.session.behavior.runtime.state.tick,
      behavior_state_root: this.session.behavior.runtime.stateRoot(),
      network_tick: this.network_health?.server?.tick ?? null,
      network_state_root: this.network_health?.server?.stateRoot ?? null,
    };
    const activeRuntimeUnchanged = root(activeBefore) === root(activeAfter);
    const checksMatch = checks.length === entries.length && checks.every(check => check.match === true);
    const hasEntries = entries.length > 0;
    const replayBase = {
      format: REALITY_STUDIO_INTEGRATED_REPLAY_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      authority: 'evidence-only-isolated-replay-no-active-runtime-mutation',
      scope: 'isolated-behavior-network-replay',
      canonical_state_mutated: !activeRuntimeUnchanged,
      verification_requested: verify === true,
      status: !hasEntries ? 'unavailable' : checksMatch && activeRuntimeUnchanged ? 'verified' : 'failed',
      deterministic: hasEntries && checksMatch && activeRuntimeUnchanged,
      reason: hasEntries ? null : 'No recorded integration entries are available for replay in the selected epoch.',
      epoch_id: epoch.epoch_id,
      epoch_root: epoch.epoch_root,
      timeline_root: this._integrationTimelineRoot(epoch),
      target_epoch_tick: targetEpochTick,
      replayed_entries: entries.length,
      active_runtime_unchanged: activeRuntimeUnchanged,
      active_runtime_before_root: root(activeBefore),
      active_runtime_after_root: root(activeAfter),
      checks,
      final_behavior_state_root: behaviorReplay.runtime.stateRoot(),
      final_network_state_root: finalNetworkResult?.snapshot?.stateRoot ?? epoch.network_base_state_root,
      final_network_receipt_root: finalNetworkResult?.snapshot?.serverReceiptRoot ?? null,
    };
    return { ...replayBase, replay_root: root(replayBase) };
  }

  record(type, details = {}) {
    const payload = {
      sequence: ++this.event_sequence,
      event_id: `studio-event:${this.event_sequence}`,
      time: FIXED_TIME,
      type: String(type),
      details: clone(details),
    };
    this.events.push({ ...payload, event_root: root(payload) });
    if (this.events.length > 300) this.events.shift();
  }

  _refreshBranchEvaluation() {
    const unified = this.session.inspect();
    const baseState = {
      format: 'taowind.reality-studio-review-state.v0.1',
      project_root: this.compilation.project_root,
      compilation_root: this.compilation.compilation_root,
      network_state_root: this.network_envelope?.stateRoot ?? null,
      behavior_program_root: unified.behavior.program.program_root,
      behavior_state_root: unified.behavior.runtime.state_root,
      vsr_frame_root: this.last_viewport?.frame_root ?? ZERO_ROOT,
    };
    const specs = [
      {
        branch_id: 'branch:baseline',
        label: 'Baseline review',
        focus: 'baseline',
        metrics: { benefit: 4200, cost: 1000, risk: 900, confidence: 7800, duration: 1200 },
      },
      {
        branch_id: 'branch:rsr-vsr',
        label: 'RSR / VSR closure',
        focus: 'rsr-vsr',
        metrics: { benefit: 5600, cost: 1500, risk: 1200, confidence: 8200, duration: 1400 },
      },
      {
        branch_id: 'branch:behavior-safety',
        label: 'Behavior safety',
        focus: 'behavior-safety',
        metrics: { benefit: 4800, cost: 1200, risk: 500, confidence: 8700, duration: 1600 },
      },
    ];
    const branches = specs.map(spec => createBranch({
      branch_id: spec.branch_id,
      parent_branch_id: 'branch:main',
      label: spec.label,
      hypothesis: `Review ${spec.focus} using the current verified Studio roots.`,
      operations: [{
        operation_id: `operation:${spec.focus}`,
        op: 'set',
        path: 'candidate.review_focus',
        value: spec.focus,
        impact: {
          benefit: spec.metrics.benefit,
          cost: spec.metrics.cost,
          risk: spec.metrics.risk,
          confidence_delta: 0,
          duration: spec.metrics.duration,
        },
      }],
      predicted_metrics: spec.metrics,
      constraints: { max_risk: 9000, max_cost: 9000, max_duration: 9000, min_confidence: 5000 },
      invariants: [{ path: 'project_root', operator: 'equals', value: this.compilation.project_root, code: 'SOURCE_PROJECT_ROOT_PRESERVED' }],
      tags: ['reality-studio', 'review-only', 'candidate'],
    }));
    const workspace = createWorkspace({
      reality_id: `reality:studio:${this.compilation.project_id}`,
      base_generation: 0,
      base_generation_root: this.compilation.compilation_root,
      base_branch_id: 'branch:main',
      project_root: this.compilation.project_root,
      base_state: baseState,
      branches,
      authority_policy: { required: true, resolver: 'local-ui:operator' },
      metadata: {
        source_compilation_root: this.compilation.compilation_root,
        source_runtime_state_root: this.network_envelope?.stateRoot ?? null,
        authority_boundary: 'candidate-review-only',
      },
    });
    const simulations = branches.map(branch => simulateBranch(workspace, branch.branch_id));
    const comparison = compareBranches(workspace, simulations);
    const proposal = createMergeProposal(workspace, comparison, comparison.recommended_branch_id, {
      actor: 'subject:reality-studio-operator',
      require_authority: true,
    });
    const authorityRequest = createAuthorityRequest(proposal, {
      resolver: 'local-ui:operator',
      risk_class: 'medium',
      requested_scope: 'review-candidate-reality',
    });
    this.branch_evaluation = {
      format: 'taowind.reality-studio-branch-evaluation.v0.1',
      authority: 'candidate-review-only',
      workspace,
      simulations,
      comparison,
      proposal,
      authority_request: authorityRequest,
      transition_draft: null,
      recommended_branch_id: comparison.recommended_branch_id,
    };
    return this.branch_evaluation;
  }

  _sourceRoots(unified, branchEvaluation) {
    const integration = this._integrationEpochView();
    return {
      project_root: this.compilation?.project_root ?? unified?.project?.project_root ?? null,
      spatial_workspace_root: this.compilation?.spatial_workspace_root ?? null,
      source_world_root: this.compilation?.source_world_root ?? null,
      active_scene_root: this.compilation?.active_scene_root ?? null,
      network_authoring_root: this.compilation?.authoring_root ?? null,
      network_compilation_root: this.compilation?.compilation_root ?? null,
      network_world_config_root: this.compilation?.world_config_root ?? null,
      behavior_program_root: unified?.behavior?.program?.program_root ?? null,
      behavior_state_root: unified?.behavior?.runtime?.state_root ?? null,
      input_profile_root: unified?.input?.profile?.input_root ?? null,
      input_frame_root: unified?.input?.last_frame?.frame_root ?? null,
      unified_spatial_workspace_root: unified?.spatial?.workspace?.workspace_root ?? null,
      unified_spatial_state_root: unified?.spatial?.snapshot?.stateRoot ?? null,
      unified_spatial_body_root: unified?.spatial?.snapshot?.bodyRoot ?? null,
      unified_spatial_character_root: unified?.spatial?.snapshot?.characterRoot ?? null,
      unified_spatial_frame_root: unified?.spatial?.frame?.frame_root ?? null,
      asset_audit_root: unified?.assets?.audit?.audit_root ?? null,
      sequence_root: unified?.sequence?.sequence?.sequence_root ?? null,
      rsr_state_root: this.network_snapshot?.stateRoot ?? null,
      rsr_body_root: this.network_snapshot?.bodyRoot ?? null,
      vsr_frame_root: this.last_viewport?.frame_root ?? null,
      vsr_pixel_root: this.last_viewport?.pixel_root ?? null,
      vsr_viewport_root: this.last_viewport?.viewport_root ?? null,
      world_body_root: this.world_body_candidate?.manifest?.worldBodyRoot ?? null,
      world_body_manifest_root: this.world_body_candidate?.manifest?.manifestRoot ?? null,
      branch_workspace_root: branchEvaluation?.workspace?.workspace_root ?? null,
      branch_comparison_root: branchEvaluation?.comparison?.comparison_root ?? null,
      integration_epoch_root: integration.epoch_root ?? null,
      integration_timeline_root: integration.timeline_root ?? null,
      integrated_replay_root: this.last_replay?.replay_root ?? null,
      asset_streaming_catalog_root: this.last_asset_streaming?.catalog_root ?? null,
      asset_streaming_receipt_root: this.last_asset_streaming?.receipt_root ?? null,
    };
  }

  _gameCapabilitiesView(unified) {
    const input = unified?.input ?? {};
    const profile = input.profile ?? null;
    const actionEntries = Object.entries(profile?.actions ?? {});
    const bindingCount = actionEntries.reduce((total, [, action]) => total + (Array.isArray(action?.bindings) ? action.bindings.length : 0), 0);
    const spatial = unified?.spatial ?? {};
    const spatialSnapshot = spatial.snapshot ?? {};
    const spatialValidation = spatial.validation ?? {};
    const bodies = Array.isArray(spatialSnapshot.bodies) ? spatialSnapshot.bodies : [];
    const characters = Array.isArray(spatialSnapshot.characters) ? spatialSnapshot.characters : [];
    const sequence = unified?.sequence?.sequence ?? {};
    const tracks = Array.isArray(sequence.tracks) ? sequence.tracks : [];
    const animationTracks = tracks.filter(track => track?.type === 'animation');
    const animationClipCount = animationTracks.reduce((total, track) => total + (Array.isArray(track?.clips) ? track.clips.length : 0), 0);
    const assets = unified?.assets ?? {};
    const assetItems = Array.isArray(assets.items) ? assets.items : [];
    const assetAudit = assets.audit?.summary ?? {};
    const stream = this.last_asset_streaming;
    const streamReceipt = stream?.receipt ?? null;
    const readyAssetCount = streamReceipt?.readyAssetIds?.length ?? 0;
    const failedAssetCount = streamReceipt?.failedAssetIds?.length ?? 0;
    const blockedAssetCount = streamReceipt?.blockedAssetIds?.length ?? 0;
    const streamStatus = stream
      ? failedAssetCount > 0
        ? 'failed'
        : readyAssetCount === assetItems.length && assetItems.length > 0
          ? 'verified'
          : readyAssetCount > 0
            ? 'candidate-verified'
            : 'unavailable'
      : 'experimental';
    const runtimeHealthy = this.network_health?.server?.status === 'healthy';
    const playerIds = this.joined_slots.map(slot => slot.player_id).filter(Boolean);
    const activeActions = input.last_frame
      ? Object.entries(input.last_frame.actions ?? {}).filter(([, action]) => action?.pressed === true).map(([name]) => name)
      : [];
    const systems = [
      {
        id: 'input',
        title: 'Player Input',
        subtitle: 'InputActionRuntime / action map',
        owner: 'UnifiedManufacturingSession',
        status: profile ? 'ready' : 'unavailable',
        authority: 'input profile projection',
        source: 'session.input.profile',
        api: 'session.sampleInput(raw)',
        summary: profile ? `${actionEntries.length} actions · ${bindingCount} bindings` : 'input profile unavailable',
        metrics: {
          actions: actionEntries.length,
          bindings: bindingCount,
          devices: Object.values(profile?.devices ?? {}).filter(Boolean).length,
          runtime_state: input.last_frame ? 'sampled' : 'configured',
          active_actions: activeActions.length,
        },
        roots: {
          profile_root: profile?.input_root ?? null,
          last_frame_root: input.last_frame?.frame_root ?? null,
        },
        evidence_refs: [profile?.input_root, input.last_frame?.frame_root].filter(Boolean),
        gaps: profile ? [] : ['GAP_GAME_INPUT_PROFILE'],
      },
      {
        id: 'spatial',
        title: 'Spatial Bodies',
        subtitle: 'RSR spatial authoring preview',
        owner: 'SpatialStudioSession / RSR',
        status: spatialValidation.valid ? 'ready' : 'failed',
        authority: 'authoring-preview; Network RSR remains authoritative',
        source: 'session.spatial.inspect()',
        api: 'session.spatialStep({ commands })',
        summary: `${bodies.length} bodies · ${characters.length} characters · tick ${spatialSnapshot.tick ?? '—'}`,
        metrics: {
          tick: spatialSnapshot.tick ?? null,
          bodies: bodies.length,
          characters: characters.length,
          contacts: spatialSnapshot.contacts?.length ?? 0,
          joints: spatialSnapshot.joints?.length ?? 0,
          frame_verified: spatial.frame?.verified === true,
        },
        roots: {
          workspace_root: spatial.workspace?.workspace_root ?? null,
          state_root: spatialSnapshot.stateRoot ?? null,
          body_root: spatialSnapshot.bodyRoot ?? null,
          character_root: spatialSnapshot.characterRoot ?? null,
          frame_root: spatial.frame?.frame_root ?? null,
        },
        evidence_refs: [spatialSnapshot.stateRoot, spatialSnapshot.bodyRoot, spatialSnapshot.characterRoot, spatial.frame?.frame_root].filter(Boolean),
        gaps: [],
      },
      {
        id: 'character',
        title: 'Character Control',
        subtitle: 'Capsule controller / grounded state',
        owner: 'RSR Spatial Embodiment',
        status: characters.length > 0 ? 'ready' : 'unavailable',
        authority: 'authoring-preview; player commands enter Network RSR separately',
        source: 'session.spatial.snapshot.characters',
        api: 'session.spatialStep({ commands })',
        summary: characters.length > 0 ? `${characters.length} controllers · ${characters.filter(character => character.grounded).length} grounded` : 'no character controller',
        metrics: {
          controllers: characters.length,
          bound_bodies: characters.filter(character => character?.bodyId).length,
          grounded: characters.filter(character => character?.grounded === true).length,
          tick: spatialSnapshot.tick ?? null,
        },
        roots: {
          state_root: spatialSnapshot.stateRoot ?? null,
          character_root: spatialSnapshot.characterRoot ?? null,
        },
        evidence_refs: [spatialSnapshot.characterRoot, spatialSnapshot.stateRoot].filter(Boolean),
        gaps: [],
      },
      {
        id: 'animation',
        title: 'Animation Tracks',
        subtitle: 'Sequencer presentation layer',
        owner: 'Sequence Workbench',
        status: animationClipCount > 0 ? 'ready' : animationTracks.length > 0 ? 'experimental' : 'unavailable',
        authority: 'presentation only; no authoritative animation clip is inferred',
        source: 'session.sequence',
        api: 'session.sequenceView()',
        summary: `${animationTracks.length} tracks · ${animationClipCount} clips`,
        metrics: {
          animation_tracks: animationTracks.length,
          clips: animationClipCount,
          authored_tracks: tracks.length,
          state: animationClipCount > 0 ? 'authored' : 'no-clips-authored',
        },
        roots: {
          sequence_root: sequence.sequence_root ?? null,
          frame_root: unified?.sequence?.last_frame?.frame_root ?? null,
        },
        evidence_refs: [sequence.sequence_root, unified?.sequence?.last_frame?.frame_root].filter(Boolean),
        gaps: animationClipCount > 0 ? [] : ['GAP_GAME_ANIMATION_CLIPS'],
      },
      {
        id: 'assets',
        title: 'Asset Streaming',
        subtitle: 'VSR spatial asset cache',
        owner: 'Asset Streaming Runtime',
        status: streamStatus,
        authority: 'cache residency evidence only; VSR embedded projection is not cache residency',
        source: 'session.assetStreaming()',
        api: 'session.assetStreaming({ request })',
        summary: stream ? `${readyAssetCount} ready · ${failedAssetCount} failed · ${blockedAssetCount} blocked` : `${assetItems.length} assets · request not started`,
        metrics: {
          catalog_assets: assetItems.length,
          ready: readyAssetCount,
          failed: failedAssetCount,
          blocked: blockedAssetCount,
          bytes_resident: streamReceipt?.bytesLoaded ?? 0,
          audit_warnings: assetAudit.warnings ?? 0,
        },
        roots: {
          audit_root: assets.audit?.audit_root ?? null,
          catalog_root: stream?.catalog_root ?? null,
          receipt_root: stream?.receipt_root ?? null,
        },
        evidence_refs: [assets.audit?.audit_root, stream?.catalog_root, stream?.receipt_root].filter(Boolean),
        gaps: streamStatus === 'experimental' ? ['GAP_GAME_ASSET_STREAMING_NOT_STARTED'] : streamStatus === 'failed' ? ['GAP_GAME_ASSET_STREAM_PAYLOAD_CACHE'] : [],
        reason: stream
          ? failedAssetCount > 0 ? 'The real cache request returned failed asset operations; no residency is claimed.' : null
          : 'No stream request has been issued by this adapter session; cache residency is not inferred from the verified VSR projection.',
      },
    ];
    const payload = {
      format: REALITY_STUDIO_GAME_CAPABILITIES_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      authority: 'product-body-projection-only',
      source: 'UnifiedManufacturingSession.inspect()',
      world: {
        scene_id: unified?.project?.active_scene_id ?? null,
        scene_nodes: unified?.scene?.nodes?.length ?? 0,
        network_players: this.network_health?.server?.players ?? null,
        network_bodies: this.network_snapshot?.bodies?.length ?? null,
        active_world_id: spatial.workspace?.active_world_id ?? null,
      },
      systems,
      controls: {
        input_sample: {
          available: Boolean(profile),
          source: 'session.sampleInput(raw)',
          status: input.last_frame ? 'recorded' : 'unavailable',
          last_frame_root: input.last_frame?.frame_root ?? null,
        },
        game_input: {
          available: runtimeHealthy && playerIds.length > 0 && Boolean(profile),
          source: 'session.sampleInput + networkRuntime.submitInput + advanceServerTick',
          player_ids: playerIds,
          default_player_id: playerIds[0] ?? null,
        },
        player_command: {
          available: runtimeHealthy && playerIds.length > 0,
          source: 'networkRuntime.submitInput + advanceServerTick',
          player_ids: playerIds,
          default_player_id: playerIds[0] ?? null,
          command_types: ['move', 'jump', 'impulse'],
        },
        spatial_preview_step: {
          available: spatialValidation.valid === true,
          source: 'session.spatialStep({ commands })',
          authority: 'authoring-preview-only',
        },
        asset_stream: {
          available: assetItems.length > 0,
          source: 'session.assetStreaming({ request })',
          status: streamStatus,
          reason: stream ? null : 'request-on-demand; no cache request has been issued',
        },
      },
      boundaries: [
        'Network RSR snapshot is the current authoritative multiplayer state.',
        'Unified spatial snapshot is an authoring-preview state and is not silently promoted to network authority.',
        'Animation tracks remain presentation-only until real clips are authored and bound.',
        'Asset streaming reports cache receipts only; verified VSR drawing does not imply cache residency.',
      ],
      root: null,
    };
    payload.root = root(payload);
    return payload;
  }

  _buildGaps(unified, gameCapabilities = null) {
    const game = gameCapabilities ?? this._gameCapabilitiesView(unified);
    const gaps = [
      {
        code: 'RCL_GAP_STUDIO_COMBINED_RUNTIME_TICK',
        status: 'open',
        severity: 'medium',
        detail: 'The adapter now records relative Behavior/Network integration epochs and can replay them in isolation, but RCL/RNCS still has no canonical shared Studio tick coordinator or shared receipt owner.',
        evidence: [unified.behavior.runtime.state_root, this.network_snapshot?.stateRoot ?? null, this._integrationEpochView().timeline_root ?? null],
      },
      {
        code: 'GAP_NETWORK_EXTERNAL_TRANSPORT',
        status: this.network_health?.transport?.transport?.candidate_only === true ? 'unavailable' : 'open',
        severity: 'high',
        detail: 'The verified network path is the existing deterministic loopback transport. Public WAN, WebSocket, UDP, QUIC, WebRTC, TLS, and relay evidence are not present in this Studio path.',
        evidence: [this.network_health?.transport?.transport?.profile_root ?? null],
      },
      {
        code: 'GAP_PRODUCTION_PROMOTION_AUTHORITY',
        status: 'unavailable',
        severity: 'high',
        detail: 'The UI can explicitly authorize and commit a local candidate through the existing live-update engine, but production promotion and external key custody are not exposed here.',
        evidence: [this.candidate?.engine?.envelope?.authority?.decision_root ?? null],
      },
      {
        code: 'GAP_RUNTIME_RESOURCE_METRICS',
        status: 'unavailable',
        severity: 'low',
        detail: 'CPU, memory, GPU utilization, and FPS are not emitted by the current RNCS runtime API and therefore are not rendered as numbers.',
        evidence: [],
      },
      {
        code: 'GAP_AGENT_HUB_API',
        status: 'unavailable',
        severity: 'medium',
        detail: 'The reference product surface includes an Agent Hub, but no real Agent Hub endpoint is connected to this first adapter slice.',
        evidence: [],
      },
      {
        code: 'GAP_NETWORK_REPLAY_COUPLING',
        status: this.last_replay?.status === 'failed' ? 'failed' : this.last_replay?.deterministic === true ? 'candidate-verified' : 'open',
        severity: 'medium',
        detail: this.last_replay?.deterministic === true
          ? 'Existing Behavior and Network Runtime checkpoint APIs replayed the adapter epoch in an isolated runtime with matching roots. This is local candidate evidence, not a canonical shared runtime receipt owner.'
          : 'No verified isolated Behavior + Network Runtime replay receipt is available for the active adapter epoch.',
        evidence: [this._integrationEpochView().timeline_root ?? null, this.last_replay?.replay_root ?? null],
      },
    ];
    for (const detail of this.world_body_summary?.gaps ?? []) {
      gaps.push({
        code: 'GAP_WORLD_BODY_BRIDGE_FACET',
        status: 'open',
        severity: 'medium',
        detail,
        evidence: [this.world_body_candidate?.manifest?.manifestRoot ?? null],
      });
    }
    const animation = game.systems.find(system => system.id === 'animation');
    if (animation?.status === 'experimental') {
      gaps.push({
        code: 'GAP_GAME_ANIMATION_CLIPS',
        status: 'experimental',
        severity: 'low',
        detail: 'The existing Sequencer exposes an animation track, but this game-world session has no authored animation clips to drive.',
        evidence: animation.evidence_refs,
      });
    }
    const assets = game.systems.find(system => system.id === 'assets');
    if (assets?.status === 'experimental') {
      gaps.push({
        code: 'GAP_GAME_ASSET_STREAMING_NOT_STARTED',
        status: 'experimental',
        severity: 'low',
        detail: assets.reason,
        evidence: assets.evidence_refs,
      });
    } else if (assets?.status === 'failed') {
      gaps.push({
        code: 'GAP_GAME_ASSET_STREAM_PAYLOAD_CACHE',
        status: 'open',
        severity: 'medium',
        detail: assets.reason,
        evidence: assets.evidence_refs,
      });
    }
    return gaps;
  }

  _candidateView() {
    if (!this.candidate) {
      return {
        status: 'unavailable',
        phase: 'none',
        authority: 'candidate-only',
        reason: 'No live-update candidate has been proposed.',
        candidate_id: null,
        candidate: null,
        simulation: null,
        verification: { valid: false, reason: 'candidate-not-proposed' },
      };
    }
    const phase = this.candidate.phase;
    const status = phase === 'committed' ? 'committed-local-candidate' : phase;
    return {
      status,
      phase,
      authority: 'candidate-only-until-explicit-local-approval',
      candidate_id: this.candidate.candidate_id,
      base: clone(this.candidate.base),
      candidate: clone(this.candidate.candidate),
      patches: clone(this.candidate.patches),
      deterministic: this.candidate.deterministic === true,
      simulation: this.candidate.simulation ? {
        simulation_root: this.candidate.simulation.simulation_root,
        status: this.candidate.simulation.status ?? 'verified',
        target_generation: this.candidate.simulation.target_generation ?? null,
        after_state_root: this.candidate.simulation.after_state_root ?? null,
      } : null,
      engine: this.candidate.engine ? {
        status: this.candidate.engine.status,
        proposal_root: this.candidate.engine.envelope?.proposal_root ?? null,
        decision_root: this.candidate.engine.envelope?.authority?.decision_root ?? null,
        commit_root: this.candidate.engine.envelope?.commit?.commit_root ?? null,
      } : null,
      verification: clone(this.candidate.verification ?? { valid: false }),
    };
  }

  _commitGate(branchEvaluation, gaps) {
    const candidate = this._candidateView();
    const runtimeHealthy = this.network_health?.server?.status === 'healthy';
    const simulationVerified = candidate.deterministic === true && Boolean(candidate.simulation?.simulation_root);
    const authorityApproved = candidate.phase === 'authorized' || candidate.phase === 'committed';
    const localCommitReady = runtimeHealthy && simulationVerified && authorityApproved && candidate.phase === 'authorized';
    const checks = [
      { id: 'network-compilation', label: 'Network compilation', status: this.compilation_verification?.valid ? 'verified' : 'failed', root: this.compilation?.compilation_root ?? null },
      { id: 'runtime-health', label: 'Authoritative runtime health', status: runtimeHealthy ? 'verified' : 'unavailable', root: this.network_health?.server?.stateRoot ?? null },
      { id: 'candidate-simulation', label: 'Candidate deterministic simulation', status: simulationVerified ? 'verified' : 'required', root: candidate.simulation?.simulation_root ?? null },
      { id: 'authority-decision', label: 'Explicit local authority decision', status: authorityApproved ? 'verified' : 'required', root: candidate.engine?.decision_root ?? null },
      { id: 'explicit-confirmation', label: 'Commit confirmation', status: candidate.phase === 'committed' ? 'verified' : 'required', root: candidate.engine?.commit_root ?? null },
      { id: 'production-promotion', label: 'Production promotion', status: 'unavailable', root: null, reason: 'External production authority and deployment are outside this adapter.' },
    ];
    const payload = {
      format: 'taowind.reality-studio-commit-gate.v0.1',
      version: REALITY_STUDIO_ADAPTER_VERSION,
      authority: 'local-candidate-gate-no-production-promotion',
      status: candidate.phase === 'committed'
        ? 'candidate-committed'
        : localCommitReady ? 'awaiting-explicit-confirmation' : 'locked',
      candidate_id: candidate.candidate_id,
      branch_proposal_root: branchEvaluation.proposal.proposal_root,
      checks,
      gaps: gaps.filter(gap => ['GAP_PRODUCTION_PROMOTION_AUTHORITY', 'GAP_NETWORK_EXTERNAL_TRANSPORT'].includes(gap.code)),
      local_candidate_commit_ready: localCommitReady,
      commit_permitted: false,
      production_promotion_permitted: false,
    };
    return { ...payload, gate_root: root(payload) };
  }

  _runtimeView() {
    const health = this.network_health;
    const server = health?.server ?? null;
    const transport = health?.transport ?? null;
    const profile = transport?.transport ?? null;
    return {
      status: server?.status === 'healthy' ? 'healthy' : 'unavailable',
      control_mode: this.control_mode,
      session_id: this.network_session_id,
      runtime_id: health?.runtime_id ?? null,
      version: health?.version ?? null,
      protocol: health?.protocol ?? null,
      tick: server?.tick ?? null,
      state_root: server?.stateRoot ?? null,
      server: {
        status: server?.status ?? 'unavailable',
        tick: server?.tick ?? null,
        state_root: server?.stateRoot ?? null,
        players: server?.players ?? null,
        authoritative_world_instances: server?.authoritativeWorldInstances ?? null,
        authority_history_ticks: server?.authorityHistoryTicks ?? null,
        rejections: server?.rejections ?? null,
        receipts: server?.receipts ?? null,
      },
      transport: {
        sent: transport?.sent ?? null,
        delivered: transport?.delivered ?? null,
        dropped: transport?.dropped ?? null,
        duplicated: transport?.duplicated ?? null,
        bytes: transport?.bytes ?? null,
        queued: transport?.queued ?? null,
        tick: transport?.tick ?? null,
        node_id: profile?.node_id ?? null,
        profile_root: profile?.profile_root ?? null,
        fabric_root: profile?.fabric_root ?? null,
        candidate_only: profile?.candidate_only ?? null,
        authoritative: profile?.authoritative ?? null,
        commit_status: profile?.commit_status ?? null,
      },
      clients: clone(health?.clients ?? {}),
      external_clients: clone(health?.externalClients ?? {}),
      metrics: {
        tick: server?.tick ?? null,
        players: server?.players ?? null,
        packets_sent: transport?.sent ?? null,
        packets_delivered: transport?.delivered ?? null,
        packets_dropped: transport?.dropped ?? null,
        cpu: { status: 'unavailable', reason: 'RNCS runtime does not expose CPU utilization.' },
        memory: { status: 'unavailable', reason: 'RNCS runtime does not expose process memory utilization.' },
        gpu: { status: 'unavailable', reason: 'RNCS runtime does not expose GPU utilization.' },
        fps: { status: 'unavailable', reason: 'RNCS runtime does not expose a presentation FPS measurement.' },
      },
    };
  }

  _buildEvidenceLedger(unified, branchEvaluation, gaps, gameCapabilities = null) {
    const sourceRoots = this._sourceRoots(unified, branchEvaluation);
    const compilationVerified = this.compilation_verification?.valid === true;
    const viewportVerified = this.last_viewport?.frame_verified === true;
    const integration = this._integrationEpochView();
    const game = gameCapabilities ?? this._gameCapabilitiesView(unified);
    const gameSystem = id => game.systems.find(system => system.id === id) ?? null;
    const inputSystem = gameSystem('input');
    const spatialSystem = gameSystem('spatial');
    const characterSystem = gameSystem('character');
    const animationSystem = gameSystem('animation');
    const assetsSystem = gameSystem('assets');
    const entries = [
      { entry_id: 'source-project', kind: 'unified-project', status: unified.validation?.valid ? 'verified' : 'failed', root: sourceRoots.project_root, owner: 'UnifiedManufacturingSession' },
      { entry_id: 'network-compilation', kind: 'network-world-compilation', status: compilationVerified ? 'verified' : 'failed', root: sourceRoots.network_compilation_root, owner: 'Network World Compiler' },
      { entry_id: 'world-body-candidate', kind: 'world-body-ingress', status: this.world_body_verification ? 'candidate-verified' : 'failed', root: sourceRoots.world_body_manifest_root, owner: 'World Body Studio Bridge' },
      { entry_id: 'authoritative-rsr', kind: 'rsr-authority-snapshot', status: this.network_snapshot?.stateRoot ? 'verified' : 'unavailable', root: sourceRoots.rsr_state_root, owner: 'Reality Network Runtime / RSR' },
      { entry_id: 'vsr-viewport', kind: 'vsr-projection', status: viewportVerified ? 'verified' : 'unavailable', root: sourceRoots.vsr_viewport_root, frame_root: sourceRoots.vsr_frame_root, pixel_root: sourceRoots.vsr_pixel_root, owner: 'VSR GLB Projection' },
      { entry_id: 'branch-comparison', kind: 'reality-branch-comparison', status: branchEvaluation.comparison?.comparison_root ? 'candidate-verified' : 'unavailable', root: sourceRoots.branch_comparison_root, owner: 'Reality Branch Fabric' },
      { entry_id: 'behavior-runtime', kind: 'behavior-runtime', status: unified.behavior.validation?.valid ? 'verified' : 'failed', root: sourceRoots.behavior_state_root, program_root: sourceRoots.behavior_program_root, owner: 'Behavior Fabric' },
      { entry_id: 'integrated-runtime-timeline', kind: 'adapter-behavior-network-epoch', status: integration.status, root: integration.timeline_root, epoch_root: integration.epoch_root ?? null, owner: 'Reality Studio Adapter + existing runtime snapshots' },
      { entry_id: 'integrated-replay', kind: 'isolated-behavior-network-replay', status: this.last_replay?.status ?? 'unavailable', root: this.last_replay?.replay_root ?? null, timeline_root: integration.timeline_root, owner: 'BehaviorEditorSession + RealityNetworkRuntime checkpoint replay' },
      { entry_id: 'game-input-profile', kind: 'game-input-profile', status: inputSystem?.status ?? 'unavailable', root: inputSystem?.roots?.profile_root ?? null, frame_root: inputSystem?.roots?.last_frame_root ?? null, owner: inputSystem?.owner ?? 'UnifiedManufacturingSession' },
      { entry_id: 'game-spatial-preview', kind: 'spatial-authoring-preview', status: spatialSystem?.metrics?.frame_verified ? 'candidate-verified' : 'unavailable', root: spatialSystem?.roots?.frame_root ?? spatialSystem?.roots?.state_root ?? null, state_root: spatialSystem?.roots?.state_root ?? null, owner: spatialSystem?.owner ?? 'SpatialStudioSession / RSR' },
      { entry_id: 'game-character-controllers', kind: 'character-controller-preview', status: characterSystem?.status ?? 'unavailable', root: characterSystem?.roots?.character_root ?? null, state_root: characterSystem?.roots?.state_root ?? null, owner: characterSystem?.owner ?? 'RSR Spatial Embodiment' },
      { entry_id: 'game-animation-sequence', kind: 'animation-sequence-presentation', status: animationSystem?.status ?? 'unavailable', root: animationSystem?.roots?.sequence_root ?? null, owner: animationSystem?.owner ?? 'Sequence Workbench' },
      { entry_id: 'game-asset-streaming', kind: 'asset-streaming-receipt', status: assetsSystem?.status ?? 'unavailable', root: assetsSystem?.roots?.receipt_root ?? assetsSystem?.roots?.catalog_root ?? null, catalog_root: assetsSystem?.roots?.catalog_root ?? null, owner: assetsSystem?.owner ?? 'Asset Streaming Runtime' },
      { entry_id: 'adapter-events', kind: 'adapter-event-head', status: this.events.length ? 'recorded' : 'unavailable', root: this.events.at(-1)?.event_root ?? null, owner: 'Reality Studio Adapter' },
      { entry_id: 'production-promotion', kind: 'production-promotion', status: 'unavailable', root: null, owner: 'External authority gate' },
    ];
    const payload = {
      format: REALITY_STUDIO_EVIDENCE_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      authority: 'evidence-recording-no-commit-authority',
      session_id: this.session_id,
      source_roots: sourceRoots,
      entries,
      gaps: gaps.map(gap => ({ code: gap.code, status: gap.status, severity: gap.severity })),
      event_count: this.events.length,
      event_head_root: this.events.at(-1)?.event_root ?? null,
      claims: {
        local_network_runtime: compilationVerified && Boolean(this.network_snapshot?.stateRoot),
        world_body_candidate: this.world_body_verification,
        vsr_frame: viewportVerified,
        behavior_replay: Boolean(this.last_replay?.deterministic),
        integrated_behavior_network_replay: Boolean(this.last_replay?.deterministic),
        integrated_replay_canonical_owner: false,
        game_input_profile: inputSystem?.status === 'ready',
        game_spatial_preview: spatialSystem?.metrics?.frame_verified === true,
        game_spatial_preview_canonical_owner: false,
        game_character_controllers: (characterSystem?.metrics?.controllers ?? 0) > 0,
        game_animation_clips: (animationSystem?.metrics?.clips ?? 0) > 0,
        game_asset_streaming_receipt: Boolean(assetsSystem?.roots?.receipt_root),
        production_runtime: false,
      },
    };
    return { ...payload, ledger_root: root(payload) };
  }

  _buildGraph(unified, branchEvaluation, ledger, gate, gaps) {
    const runtime = this._runtimeView();
    const candidate = this._candidateView();
    const integration = this._integrationEpochView();
    const sourceRoots = this._sourceRoots(unified, branchEvaluation);
    const branchRows = branchEvaluation.comparison.rows.map(row => ({
      branch_id: row.branch_id,
      score: row.score,
      eligible: row.eligible,
      candidate_state_root: row.candidate_state_root,
      simulation_root: row.simulation_root,
      expected: row.aggregate.expected,
      resilience: row.aggregate.resilience,
    }));
    const nodes = [
      graphNode({ id: 'data-source', title: 'Data Source', subtitle: 'Unified Project / assets', owner: 'Unified Manufacturing Session', status: unified.validation?.valid ? 'ready' : 'failed', format: unified.format, api: '/api/unified/session/new', source: 'session.project', rootValue: sourceRoots.project_root, metrics: { assets: unified.assets.count, scene_nodes: unified.scene.nodes?.length ?? 0 }, evidenceRefs: [sourceRoots.project_root] }),
      graphNode({ id: 'semantic-compiler', title: 'Semantic Compiler', subtitle: 'Network World Compiler', owner: 'RNCS Studio compiler', status: this.compilation_verification?.valid ? 'ready' : 'failed', format: this.compilation.format, version: this.compilation.version, api: 'session.networkCompile()', source: 'network-world-compiler.mjs', rootValue: sourceRoots.network_compilation_root, metrics: { bodies: this.compilation.counts.bodies, characters: this.compilation.counts.characters, player_slots: this.compilation.counts.player_slots }, evidenceRefs: [sourceRoots.network_compilation_root, sourceRoots.network_world_config_root] }),
      graphNode({ id: 'studio-adapter', title: 'Studio Adapter', subtitle: 'Reality Graph projection', owner: 'Reality Studio Product Body', status: this.status, format: REALITY_STUDIO_ADAPTER_FORMAT, version: REALITY_STUDIO_ADAPTER_VERSION, api: '/api/reality-studio/session/command', source: 'reality-studio-adapter.mjs', rootValue: root({ format: REALITY_STUDIO_ADAPTER_FORMAT, version: REALITY_STUDIO_ADAPTER_VERSION, session_id: this.session_id, project_root: sourceRoots.project_root, compilation_root: sourceRoots.network_compilation_root, integration_timeline_root: sourceRoots.integration_timeline_root, event_count: this.events.length }), metrics: { events: this.events.length, epoch: integration.epoch_id, integration_entries: integration.entry_count, selected: this.selected_node_id }, evidenceRefs: [sourceRoots.project_root, sourceRoots.network_compilation_root, sourceRoots.integration_timeline_root] }),
      graphNode({ id: 'reality-kernel', title: 'Reality Kernel', subtitle: 'Authoritative world state', owner: 'Reality Network Runtime / RSR', status: runtime.status === 'healthy' ? 'running' : 'unavailable', format: 'network.snapshot.v0.2', version: runtime.version, api: 'networkRuntime.getSessionHealth()', source: 'reality-network-runtime', rootValue: sourceRoots.network_world_config_root, metrics: { tick: runtime.tick, players: runtime.server.players, state_root: rootSummary(runtime.state_root) }, evidenceRefs: [sourceRoots.network_world_config_root, sourceRoots.rsr_state_root] }),
      graphNode({ id: 'world-body', title: 'World Body IR', subtitle: 'Candidate ingress', owner: 'World Body Studio Bridge', status: this.world_body_verification ? 'candidate' : 'failed', format: this.world_body_candidate.format, version: this.world_body_candidate.bridgeVersion, api: 'compileStudioWorldBodyCandidate()', source: '@taowind/world-body-studio-bridge', rootValue: sourceRoots.world_body_root, metrics: { entities: this.world_body_summary.coverage?.emitted_entity_count ?? null, bodies: this.world_body_summary.coverage?.spatial_body_count ?? null, unmapped_scene_nodes: this.world_body_summary.coverage?.unmapped_scene_node_count ?? null }, evidenceRefs: [sourceRoots.world_body_root, sourceRoots.world_body_manifest_root], gaps: this.world_body_summary.gaps }),
      graphNode({ id: 'rsr-runtime', title: 'RSR Runtime', subtitle: 'Authoritative spatial snapshot', owner: 'RSR / Network Runtime', status: sourceRoots.rsr_state_root ? 'running' : 'unavailable', format: this.network_snapshot?.rsrAuthorityProtocol ?? null, version: this.network_snapshot?.rsrSnapshot?.runtimeVersion ?? null, api: 'networkRuntime.pullSnapshot()', source: 'network_snapshot.rsrSnapshot', rootValue: sourceRoots.rsr_state_root, metrics: { tick: this.network_snapshot?.tick ?? null, bodies: this.network_snapshot?.bodies?.length ?? null, contacts: this.network_snapshot?.contacts?.length ?? null, state_root: rootSummary(sourceRoots.rsr_state_root) }, evidenceRefs: [sourceRoots.rsr_state_root, sourceRoots.rsr_body_root] }),
      graphNode({ id: 'commit-gate', title: 'Commit Gate', subtitle: 'Explicit candidate authority', owner: 'RFE / live-update engine', status: gate.status, format: gate.format, version: gate.version, api: 'session.propose/authorize/commitLiveUpdate()', source: 'scene-studio.mjs', rootValue: gate.gate_root, metrics: { local_candidate_commit_ready: gate.local_candidate_commit_ready, commit_permitted: gate.commit_permitted, production_promotion_permitted: gate.production_promotion_permitted }, evidenceRefs: [gate.gate_root, gate.branch_proposal_root], gaps: gate.gaps.map(gap => gap.code) }),
      graphNode({ id: 'vsr-projection', title: 'VSR Projection', subtitle: 'Verified GLB-backed viewport', owner: 'VSR Product Projection', status: this.last_viewport?.frame_verified ? 'ready' : 'unavailable', format: this.last_viewport?.format ?? null, version: this.last_viewport?.version ?? null, api: 'renderNetworkAssetViewport()', source: 'network-world-compiler.mjs', rootValue: sourceRoots.vsr_viewport_root, metrics: { width: this.last_viewport?.viewport?.width ?? null, height: this.last_viewport?.viewport?.height ?? null, imported_assets: this.last_viewport?.imported_asset_count ?? null, asset_draws: this.last_viewport?.asset_draw_count ?? null, frame_verified: this.last_viewport?.frame_verified ?? false }, evidenceRefs: [sourceRoots.vsr_viewport_root, sourceRoots.vsr_frame_root, sourceRoots.vsr_pixel_root], gaps: this.last_viewport?.frame_verified ? [] : ['GAP_VSR_VIEWPORT_UNAVAILABLE'] }),
      graphNode({ id: 'candidate-reality', title: 'Candidate Reality', subtitle: 'Behavior live-update candidate', owner: 'Behavior Fabric / Reality Engine Session', status: candidate.status, format: candidate.candidate?.format ?? null, version: candidate.candidate?.version ?? null, api: 'session.proposeLiveUpdate()', source: 'scene-studio.mjs', rootValue: candidate.candidate?.project_root ?? null, metrics: { deterministic: candidate.deterministic ?? false, phase: candidate.phase, candidate_id: candidate.candidate_id }, evidenceRefs: [candidate.candidate?.project_root ?? null, candidate.candidate?.program_root ?? null, candidate.simulation?.simulation_root ?? null], gaps: candidate.status === 'unavailable' ? ['GAP_CANDIDATE_NOT_PROPOSED'] : [] }),
      graphNode({ id: 'behavior-fabric', title: 'Behavior Fabric', subtitle: 'Rules / machines / runtime', owner: 'Behavior Fabric', status: unified.behavior.validation?.valid ? 'ready' : 'failed', format: unified.behavior.format, version: unified.behavior.program?.program_root ? '0.1.0-alpha.1' : null, api: 'session.behavior.step()', source: 'behavior-studio.mjs', rootValue: sourceRoots.behavior_program_root, metrics: { tick: unified.behavior.runtime.tick, epoch_tick: integration.last_epoch_tick, tick_aligned: integration.tick_aligned, entities: unified.behavior.program.counts.entities, machines: unified.behavior.program.counts.machines, commands: unified.behavior.runtime.commands }, evidenceRefs: [sourceRoots.behavior_program_root, sourceRoots.behavior_state_root, sourceRoots.integration_timeline_root] }),
      graphNode({ id: 'evidence-ledger', title: 'Evidence Ledger', subtitle: 'Roots / gaps / receipts', owner: 'Reality Studio Adapter', status: ledger.ledger_root ? 'ready' : 'unavailable', format: ledger.format, version: ledger.version, api: 'session.inspect().evidence', source: 'reality-studio-adapter.mjs', rootValue: ledger.ledger_root, metrics: { entries: ledger.entries.length, event_count: ledger.event_count, integrated_replay: this.last_replay?.status ?? 'unavailable', open_gaps: gaps.filter(gap => gap.status !== 'verified').length }, evidenceRefs: [ledger.ledger_root, ledger.event_head_root, sourceRoots.integrated_replay_root] }),
      graphNode({ id: 'network-runtime', title: 'Network Runtime', subtitle: 'Loopback authority session', owner: 'Reality Network Runtime', status: runtime.status === 'healthy' ? 'running' : 'unavailable', format: runtime.protocol, version: runtime.version, api: 'networkRuntime.advanceServerTick()', source: '@taowind/reality-network-runtime', rootValue: runtime.transport.fabric_root, metrics: { tick: runtime.tick, sent: runtime.transport.sent, delivered: runtime.transport.delivered, dropped: runtime.transport.dropped, integration_entries: integration.entry_count, replay: this.last_replay?.status ?? 'unavailable', transport: runtime.transport.candidate_only ? 'candidate-only' : 'unknown' }, evidenceRefs: [runtime.transport.profile_root, runtime.transport.fabric_root, sourceRoots.rsr_state_root, sourceRoots.integration_timeline_root], gaps: runtime.transport.candidate_only ? ['GAP_NETWORK_EXTERNAL_TRANSPORT'] : [] }),
      graphNode({ id: 'authority-fabric', title: 'Authority Fabric', subtitle: 'Player delegations / gate', owner: 'AAF + RFE', status: this.joined_slots.length === (this.compilation.player_slots?.length ?? 0) ? 'ready' : 'unavailable', format: 'network.player-delegation.v0.1', version: null, api: 'networkRuntime.joinCompiledSlot()', source: 'network-runtime/authority.mjs', rootValue: root(this.joined_slots.map(slot => ({ slot_id: slot.slot_id, subject_id: slot.subject_id, delegation_root: slot.delegation_root }))), metrics: { delegations: this.joined_slots.length, expected: this.compilation.player_slots?.length ?? null, external_key_custody: 'unavailable' }, evidenceRefs: this.joined_slots.map(slot => slot.delegation_root).filter(Boolean), gaps: ['GAP_PRODUCTION_PROMOTION_AUTHORITY'] }),
      graphNode({ id: 'agent-hub', title: 'Agent Hub', subtitle: 'No connected runtime API', owner: 'External / unavailable', status: 'unavailable', format: null, version: null, api: null, source: null, rootValue: null, metrics: { status: 'unavailable' }, evidenceRefs: [], gaps: ['GAP_AGENT_HUB_API'] }),
    ];
    for (const node of nodes) {
      node.position = GRAPH_LAYOUT[node.id] ?? node.position;
    }
    return { format: REALITY_STUDIO_GRAPH_FORMAT, version: REALITY_STUDIO_ADAPTER_VERSION, nodes, edges: clone(GRAPH_EDGES), selected_node_id: this.selected_node_id, branch_rows: branchRows, recommended_branch_id: branchEvaluation.recommended_branch_id };
  }

  _snapshotView() {
    return this.snapshots.map(snapshot => clone(snapshot));
  }

  inspect() {
    if (!this.session) fail('STUDIO_ADAPTER_NOT_INITIALIZED', 'The Reality Studio adapter is not initialized');
    this._syncNetwork('inspect');
    const unified = this.session.inspect();
    const branchEvaluation = this._refreshBranchEvaluation();
    const gameCapabilities = this._gameCapabilitiesView(unified);
    const gaps = this._buildGaps(unified, gameCapabilities);
    const gate = this._commitGate(branchEvaluation, gaps);
    const evidence = this._buildEvidenceLedger(unified, branchEvaluation, gaps, gameCapabilities);
    const graph = this._buildGraph(unified, branchEvaluation, evidence, gate, gaps);
    const selected = graph.nodes.find(node => node.id === this.selected_node_id) ?? graph.nodes[0];
    const sourceRoots = this._sourceRoots(unified, branchEvaluation);
    const integration = this._integrationEpochView();
    return {
      format: REALITY_STUDIO_ADAPTER_FORMAT,
      version: REALITY_STUDIO_ADAPTER_VERSION,
      authority: 'product-body-projection-only',
      status: this.status,
      session_id: this.session_id,
      project: {
        project_id: this.compilation.project_id,
        title: unified.project.identity.title,
        format: unified.format,
        project_root: sourceRoots.project_root,
        active_scene_id: unified.project.active_scene_id,
        validation: unified.validation,
      },
      runtime: this._runtimeView(),
      game_capabilities: gameCapabilities,
      graph,
      inspector: {
        selected_node_id: selected.id,
        selected_node: selected,
        source_roots: sourceRoots,
        properties: {
          project: this.compilation.project_id,
          runtime_session: this.network_session_id,
          behavior_tick: unified.behavior.runtime.tick,
          network_tick: this.network_health?.server?.tick ?? null,
          network_state_root: this.network_health?.server?.stateRoot ?? null,
          rsr_state_root: this.network_snapshot?.stateRoot ?? null,
          vsr_frame_root: this.last_viewport?.frame_root ?? null,
          evidence_ledger_root: evidence.ledger_root,
          integration_epoch_id: integration.epoch_id ?? null,
          integration_epoch_root: integration.epoch_root ?? null,
          integration_timeline_root: integration.timeline_root ?? null,
          integration_entry_count: integration.entry_count,
          integration_tick_aligned: integration.tick_aligned ?? false,
          integrated_replay_root: this.last_replay?.replay_root ?? null,
          integrated_replay_deterministic: this.last_replay?.deterministic ?? false,
        },
        gaps,
      },
      candidate_reality: this._candidateView(),
      commit_gate: gate,
      evidence,
      integration,
      snapshots: this._snapshotView(),
      replay: this.last_replay ? clone(this.last_replay) : { status: 'unavailable', reason: 'No integrated Behavior + Network replay has been requested.' },
      viewport: {
        status: this.last_viewport?.frame_verified ? 'verified' : 'unavailable',
        available: Boolean(this.last_viewport),
        image_available: Boolean(this.last_viewport?.png),
        format: this.last_viewport?.format ?? null,
        version: this.last_viewport?.version ?? null,
        width: this.last_viewport?.viewport?.width ?? null,
        height: this.last_viewport?.viewport?.height ?? null,
        quality_tier: this.last_viewport?.viewport?.quality_tier ?? null,
        source_state_root: this.last_viewport?.source_state_root ?? null,
        frame_root: this.last_viewport?.frame_root ?? null,
        pixel_root: this.last_viewport?.pixel_root ?? null,
        viewport_root: this.last_viewport?.viewport_root ?? null,
        imported_asset_count: this.last_viewport?.imported_asset_count ?? null,
        asset_draw_count: this.last_viewport?.asset_draw_count ?? null,
        frame_verified: this.last_viewport?.frame_verified ?? false,
      },
      controls: {
        run: { available: this.network_health?.server?.status === 'healthy', source: 'networkRuntime.advanceServerTick' },
        pause: { available: true, source: 'adapter.control_mode' },
        step: { available: this.network_health?.server?.status === 'healthy', source: 'behavior.step + networkRuntime.advanceServerTick' },
        snapshot: { available: this.network_health?.server?.status === 'healthy', source: 'networkRuntime.createCheckpoint + session.createRuntimeCheckpoint' },
        replay: {
          available: integration.entry_count > 0,
          source: 'BehaviorEditorSession.restore + RealityNetworkRuntime.createSessionFromCheckpoint',
          scope: 'isolated-behavior-network-replay',
          canonical_state_mutated: false,
          reason: integration.entry_count > 0 ? null : 'Run or step the active integration epoch before requesting replay.',
        },
        branch: { available: Boolean(branchEvaluation.comparison?.comparison_root), source: 'reality-branch-fabric' },
        candidate: { available: true, source: 'session.proposeLiveUpdate' },
        commit: { available: gate.local_candidate_commit_ready, source: 'session.commitLiveUpdate', authority: 'local-candidate-only' },
        deploy: { available: false, status: 'unavailable', reason: 'No production deployment authority is connected.' },
        input_sample: gameCapabilities.controls.input_sample,
        game_input: gameCapabilities.controls.game_input,
        player_command: gameCapabilities.controls.player_command,
        spatial_preview_step: gameCapabilities.controls.spatial_preview_step,
        asset_stream: gameCapabilities.controls.asset_stream,
      },
      event_tail: this.events.slice(-100).map(event => clone(event)),
      gaps,
    };
  }

  async _stepOnce({ behaviorInput = {}, networkInput = null } = {}) {
    const behavior = this.session.step(behaviorInput ?? {});
    let submitted = false;
    let networkInputPacket = null;
    if (networkInput?.player_id && networkInput?.command) {
      networkInputPacket = this.network_runtime.submitInput({
        sessionId: this.network_session_id,
        playerId: String(networkInput.player_id),
        command: clone(networkInput.command),
      });
      submitted = true;
    }
    const result = this.network_runtime.advanceServerTick({ sessionId: this.network_session_id, ticks: 1 });
    this._syncNetwork('runtime-step');
    const effectiveBehaviorInput = behavior.runtime_timeline?.entries?.at(-1)?.input ?? behaviorInput ?? {};
    const integration = this._appendIntegrationEntry({
      behaviorInput: effectiveBehaviorInput,
      networkInputPacket,
      behavior,
      networkResult: result,
    });
    this.record('runtime.step', {
      behavior_tick: behavior.behavior.runtime.tick,
      behavior_state_root: behavior.behavior.runtime.state_root,
      network_tick: this.network_health.server.tick,
      network_state_root: this.network_health.server.stateRoot,
      network_receipt_root: result.snapshot?.serverReceiptRoot ?? null,
      input_submitted: submitted,
      integration_epoch_id: integration.timeline.epoch_id,
      integration_entry_root: integration.entry.entry_root,
      integration_timeline_root: integration.timeline.timeline_root,
      integration_epoch_tick: integration.entry.epoch_tick,
      integration_tick_aligned: integration.entry.tick_aligned,
    });
    return result;
  }

  async _run(ticks, payload) {
    const limit = boundedTicks(ticks);
    this.control_mode = 'running';
    for (let index = 0; index < limit; index += 1) {
      const behaviorInput = Array.isArray(payload.behavior_inputs) ? payload.behavior_inputs[index] ?? {} : payload.behavior_input ?? {};
      const networkInput = Array.isArray(payload.network_inputs) ? payload.network_inputs[index] ?? null : payload.network_input ?? null;
      await this._stepOnce({ behaviorInput, networkInput });
    }
    this.control_mode = 'paused';
    this.record('runtime.run', { ticks: limit, final_tick: this.network_health.server.tick, final_state_root: this.network_health.server.stateRoot });
    await this._refreshViewport();
    return this.inspect();
  }

  async _viewportResponse() {
    await this._refreshViewport();
    return {
      ...this.inspect(),
      viewport_png_data_url: this.last_viewport?.png ? `data:image/png;base64,${Buffer.from(this.last_viewport.png).toString('base64')}` : null,
    };
  }

  _requireJoinedPlayer(playerId = null) {
    const requested = String(playerId ?? this.joined_slots[0]?.player_id ?? '');
    const player = this.joined_slots.find(slot => slot.player_id === requested);
    if (!player) {
      fail('STUDIO_PLAYER_REQUIRED', 'A joined compiled player slot is required for a network game command', {
        requested_player_id: requested || null,
        available_player_ids: this.joined_slots.map(slot => slot.player_id),
      });
    }
    return player.player_id;
  }

  async _dispatchGameInput(payload = {}) {
    const unifiedBefore = this.session.inspect();
    if (!unifiedBefore.input?.profile) {
      fail('STUDIO_INPUT_PROFILE_UNAVAILABLE', 'The active Unified Project has no verified input profile');
    }
    const playerId = this._requireJoinedPlayer(payload.player_id);
    const frame = this.session.sampleInput(clone(payload.raw ?? {}));
    const actions = this.session.inputRuntime.actionBooleans(frame);
    const axisX = (actions.move_right ? 1 : 0) - (actions.move_left ? 1 : 0);
    const axisZ = (actions.move_down ? 1 : 0) - (actions.move_up ? 1 : 0);
    const networkCommand = axisX !== 0 || axisZ !== 0
      ? { type: 'move', x: axisX * 1000000, z: axisZ * 1000000 }
      : null;
    await this._stepOnce({
      behaviorInput: actions,
      networkInput: networkCommand ? { player_id: playerId, command: networkCommand } : null,
    });
    await this._refreshViewport();
    this.record('game.input-dispatched', {
      frame_root: frame.frame_root,
      input_root: frame.input_root ?? unifiedBefore.input.profile.input_root ?? null,
      player_id: playerId,
      active_actions: Object.entries(frame.actions ?? {}).filter(([, action]) => action?.pressed === true).map(([name]) => name),
      network_command: networkCommand,
      network_tick: this.network_health?.server?.tick ?? null,
      network_state_root: this.network_health?.server?.stateRoot ?? null,
    });
    return this.inspect();
  }

  async _dispatchPlayerCommand(payload = {}) {
    const playerId = this._requireJoinedPlayer(payload.player_id);
    const command = clone(payload.player_command ?? payload.network_command ?? payload.command ?? {});
    const commandType = String(command.type ?? '');
    if (!['move', 'jump', 'impulse'].includes(commandType)) {
      fail('STUDIO_PLAYER_COMMAND_UNSUPPORTED', `Network RSR accepts move, jump, or impulse; received ${commandType || 'empty command'}`, {
        player_id: playerId,
        command_type: commandType || null,
      });
    }
    const result = await this._stepOnce({
      behaviorInput: payload.behavior_input ?? {},
      networkInput: { player_id: playerId, command },
    });
    await this._refreshViewport();
    this.record('game.player-command-dispatched', {
      player_id: playerId,
      command,
      network_tick: result.tick ?? this.network_health?.server?.tick ?? null,
      accepted_input_count: Array.isArray(result.inputs) ? result.inputs.length : null,
      network_state_root: result.snapshot?.stateRoot ?? this.network_health?.server?.stateRoot ?? null,
      network_receipt_root: result.snapshot?.serverReceiptRoot ?? null,
    });
    return this.inspect();
  }

  _stepSpatialPreview(payload = {}) {
    const commands = Array.isArray(payload.commands) ? clone(payload.commands) : [];
    const result = this.session.spatialStep({ commands });
    const spatial = result.spatial ?? this.session.inspect().spatial ?? {};
    this.record('game.spatial-preview-stepped', {
      command_count: commands.length,
      tick: spatial.snapshot?.tick ?? null,
      state_root: spatial.snapshot?.stateRoot ?? null,
      body_root: spatial.snapshot?.bodyRoot ?? null,
      character_root: spatial.snapshot?.characterRoot ?? null,
      frame_root: spatial.frame?.frame_root ?? null,
      authority: 'authoring-preview-only',
    });
    return this.inspect();
  }

  async _streamGameAssets(payload = {}) {
    const unified = this.session.inspect();
    const defaultAssetIds = (unified.assets?.items ?? [])
      .map(asset => asset.asset_id ?? asset.id)
      .filter(Boolean);
    const requestedAssetIds = Array.isArray(payload.requested_asset_ids)
      ? payload.requested_asset_ids.map(String)
      : defaultAssetIds;
    const request = {
      requestedAssetIds,
      ...(payload.request && typeof payload.request === 'object' ? clone(payload.request) : {}),
    };
    if (!Array.isArray(request.requestedAssetIds)) request.requestedAssetIds = requestedAssetIds;
    const result = await this.session.assetStreaming({
      cacheDir: payload.cache_dir,
      profile: payload.profile ?? 'runtime',
      maxConcurrent: Number(payload.max_concurrent ?? 4),
      request,
    });
    const receipt = result.asset_streaming_receipt ?? {};
    const readyAssetIds = Array.isArray(receipt.readyAssetIds) ? receipt.readyAssetIds.map(String) : [];
    const failedAssetIds = Array.isArray(receipt.failedAssetIds) ? receipt.failedAssetIds.map(String) : [];
    const blockedAssetIds = Array.isArray(receipt.blockedAssetIds) ? receipt.blockedAssetIds.map(String) : [];
    const resolution = result.asset_streaming_resolution ?? {};
    this.last_asset_streaming = {
      status: failedAssetIds.length > 0
        ? 'failed'
        : readyAssetIds.length === requestedAssetIds.length && requestedAssetIds.length > 0
          ? 'verified'
          : readyAssetIds.length > 0
            ? 'candidate-verified'
            : 'unavailable',
      request_root: root(request),
      catalog_root: result.asset_streaming_catalog_root ?? null,
      receipt_root: receipt.receiptRoot ?? null,
      receipt: {
        readyAssetIds,
        failedAssetIds,
        blockedAssetIds,
        bytesLoaded: Number(receipt.bytesLoaded ?? 0),
        operationCount: Array.isArray(receipt.operations) ? receipt.operations.length : null,
      },
      resolution: {
        resolved: resolution.resolved ?? null,
        failed: resolution.failed ?? null,
        blocked: resolution.blocked ?? null,
      },
    };
    this.record('game.asset-streaming-requested', {
      request_root: this.last_asset_streaming.request_root,
      catalog_root: this.last_asset_streaming.catalog_root,
      receipt_root: this.last_asset_streaming.receipt_root,
      requested_count: requestedAssetIds.length,
      ready_count: readyAssetIds.length,
      failed_count: failedAssetIds.length,
      blocked_count: blockedAssetIds.length,
      bytes_loaded: this.last_asset_streaming.receipt.bytesLoaded,
      status: this.last_asset_streaming.status,
    });
    return this.inspect();
  }

  async command(command, payload = {}) {
    const cmd = String(command ?? '');
    if (cmd === 'select') {
      const nodeId = String(payload.node_id ?? '');
      if (!GRAPH_LAYOUT[nodeId]) fail('STUDIO_GRAPH_NODE_NOT_FOUND', nodeId);
      this.selected_node_id = nodeId;
      this.record('graph.node-selected', { node_id: nodeId });
      return this.inspect();
    }
    if (cmd === 'step') {
      await this._stepOnce({ behaviorInput: payload.behavior_input ?? {}, networkInput: payload.network_input ?? null });
      await this._refreshViewport();
      return this.inspect();
    }
    if (cmd === 'input-sample') {
      const frame = this.session.sampleInput(clone(payload.raw ?? {}));
      this.record('game.input-sampled', {
        frame_root: frame.frame_root,
        input_root: frame.input_root ?? null,
        devices: frame.devices,
      });
      return this.inspect();
    }
    if (cmd === 'game-input') return this._dispatchGameInput(payload);
    if (cmd === 'player-command') return this._dispatchPlayerCommand(payload);
    if (cmd === 'spatial-step') return this._stepSpatialPreview(payload);
    if (cmd === 'asset-stream') return this._streamGameAssets(payload);
    if (cmd === 'run') return this._run(payload.ticks, payload);
    if (cmd === 'pause') {
      this.control_mode = 'paused';
      this.record('runtime.paused', { tick: this.network_health?.server?.tick ?? null, state_root: this.network_health?.server?.stateRoot ?? null });
      return this.inspect();
    }
    if (cmd === 'reset') {
      this.session.reset();
      this.candidate = null;
      this.last_replay = null;
      this.last_snapshot = null;
      this.snapshots = [];
      this.control_mode = 'paused';
      await this._rebuildRuntime('reset');
      this.record('runtime.reset', { tick: this.network_health.server.tick, state_root: this.network_health.server.stateRoot });
      return this.inspect();
    }
    if (cmd === 'snapshot') {
      const label = String(payload.label ?? 'studio-snapshot');
      const behaviorResult = this.session.createRuntimeCheckpoint(label);
      const behaviorCheckpoint = behaviorResult.runtime_checkpoint;
      const networkCheckpoint = this.network_runtime.createCheckpoint({ sessionId: this.network_session_id });
      const integration = this._integrationEpochView();
      const snapshotBase = {
        format: 'taowind.reality-studio.snapshot.v0.1',
        version: REALITY_STUDIO_ADAPTER_VERSION,
        authority: 'candidate-runtime-observation',
        snapshot_id: `studio-snapshot:${this.session_id}:${this.snapshots.length + 1}`,
        label,
        network_session_id: this.network_session_id,
        network_checkpoint_root: networkCheckpoint.checkpointRoot,
        behavior_checkpoint_root: behaviorCheckpoint.checkpoint_root,
        network_tick: networkCheckpoint.tick,
        network_state_root: networkCheckpoint.stateRoot,
        behavior_tick: behaviorCheckpoint.tick,
        behavior_state_root: behaviorCheckpoint.state_root,
        integration_epoch_id: integration.epoch_id ?? null,
        integration_epoch_root: integration.epoch_root ?? null,
        integration_timeline_root: integration.timeline_root ?? null,
        integration_entry_count: integration.entry_count,
        rsr_state_root: this.network_snapshot.stateRoot,
        vsr_frame_root: this.last_viewport?.frame_root ?? null,
      };
      const snapshot = { ...snapshotBase, snapshot_root: root(snapshotBase) };
      this.snapshots.push(snapshot);
      this.last_snapshot = snapshot;
      this.record('runtime.snapshot-created', { snapshot_id: snapshot.snapshot_id, snapshot_root: snapshot.snapshot_root, network_checkpoint_root: networkCheckpoint.checkpointRoot, behavior_checkpoint_root: behaviorCheckpoint.checkpoint_root, integration_timeline_root: integration.timeline_root, integration_entry_count: integration.entry_count });
      return this.inspect();
    }
    if (cmd === 'replay') {
      const toTick = payload.to_tick === undefined ? null : Number(payload.to_tick);
      this.last_replay = await this._replayIntegratedRuntime({ toTick, verify: payload.verify !== false });
      this.record('runtime.replay', {
        replay_root: this.last_replay.replay_root,
        deterministic: this.last_replay.deterministic,
        status: this.last_replay.status,
        target_epoch_tick: this.last_replay.target_epoch_tick,
        replayed_entries: this.last_replay.replayed_entries,
        active_runtime_unchanged: this.last_replay.active_runtime_unchanged,
        canonical_state_mutated: this.last_replay.canonical_state_mutated,
        scope: 'isolated-behavior-network-replay',
      });
      return this.inspect();
    }
    if (cmd === 'branch-evaluate') {
      const evaluation = this._refreshBranchEvaluation();
      this.record('branch.evaluated', { workspace_root: evaluation.workspace.workspace_root, comparison_root: evaluation.comparison.comparison_root, recommended_branch_id: evaluation.recommended_branch_id });
      return this.inspect();
    }
    if (cmd === 'candidate-propose') {
      const patches = Array.isArray(payload.patches) && payload.patches.length > 0
        ? payload.patches
        : [{ op: 'set', path: 'identity.title', value: 'Studio Candidate Reality' }];
      this.candidate = this.session.proposeLiveUpdate({
        patches,
        preserveState: payload.preserve_state !== false,
        metadata: {
          subject_id: 'subject:reality-studio-operator',
          roles: ['reviewer'],
          surface: 'reality-graph',
          ...(payload.metadata ?? {}),
        },
      });
      this.record('candidate.proposed', { candidate_id: this.candidate.candidate_id, candidate_project_root: this.candidate.candidate.project_root, candidate_program_root: this.candidate.candidate.program_root, simulation_root: this.candidate.simulation.simulation_root });
      return this.inspect();
    }
    if (cmd === 'candidate-authorize') {
      if (!this.candidate) fail('STUDIO_CANDIDATE_REQUIRED', 'Propose a candidate before authorization');
      this.candidate = this.session.authorizeLiveUpdate({
        candidateId: this.candidate.candidate_id,
        resolver: String(payload.resolver ?? 'local-ui:operator'),
        claims: Array.isArray(payload.claims) ? payload.claims : [{ kind: 'ui-explicit-approval', channel: 'reality-graph' }],
        constraints: Array.isArray(payload.constraints) ? payload.constraints : [],
        reason: String(payload.reason ?? 'Explicit local review approval'),
      });
      this.record('candidate.authorized', { candidate_id: this.candidate.candidate_id, decision_root: this.candidate.engine?.envelope?.authority?.decision_root ?? null });
      return this.inspect();
    }
    if (cmd === 'candidate-commit') {
      if (!this.candidate) fail('STUDIO_CANDIDATE_REQUIRED', 'Propose a candidate before commit');
      if (payload.confirmed !== true) fail('STUDIO_COMMIT_CONFIRMATION_REQUIRED', 'A separate explicit confirmation is required for local candidate commit');
      const candidateId = this.candidate.candidate_id;
      const result = await this.session.commitLiveUpdate({
        candidateId,
        confirmed: true,
        receiptRefs: [
          { kind: 'network-compilation', root: this.compilation.compilation_root },
          { kind: 'evidence-ledger', root: this._buildEvidenceLedger(this.session.inspect(), this._refreshBranchEvaluation(), this._buildGaps(this.session.inspect())).ledger_root },
        ],
      });
      this.candidate = result.live_update;
      await this._rebuildRuntime('candidate-commit-local');
      this.control_mode = 'paused';
      this.record('candidate.committed-local', { candidate_id: candidateId, commit_root: result.live_update_commit?.envelope?.commit?.commit_root ?? null, new_project_root: this.compilation.project_root, new_compilation_root: this.compilation.compilation_root });
      return this.inspect();
    }
    if (cmd === 'candidate-rollback') {
      if (!this.candidate) fail('STUDIO_CANDIDATE_REQUIRED', 'No candidate is available for rollback');
      const result = this.session.rollbackLiveUpdate({ candidateId: this.candidate.candidate_id, reason: String(payload.reason ?? 'candidate-withdrawn') });
      this.candidate = { ...this.candidate, phase: result.phase, engine: result.engine, verification: result.verification };
      this.record('candidate.rolled-back', { candidate_id: this.candidate.candidate_id, reason: payload.reason ?? 'candidate-withdrawn' });
      return this.inspect();
    }
    if (cmd === 'viewport') return this._viewportResponse();
    fail('STUDIO_ADAPTER_COMMAND_UNKNOWN', cmd);
  }
}

export class RealityStudioSessionRegistry {
  constructor() {
    this.sessions = new Map();
  }

  async create(options = {}) {
    const session = await RealityStudioAdapter.create(options);
    this.sessions.set(session.session_id, session);
    return session;
  }

  get(sessionId) {
    const session = this.sessions.get(String(sessionId));
    if (!session) fail('STUDIO_ADAPTER_SESSION_NOT_FOUND', String(sessionId));
    return session;
  }
}
