import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {rootHash} from '@taowind/rncs-core-contract';

export const LARGE_WORLD_MULTI_PROCESS_PROTOCOL = 'rncs.large-world-multi-process-protocol.v0.1';
export const LARGE_WORLD_MULTI_PROCESS_EVIDENCE_FORMAT = 'rncs.large-world-multi-process-evidence.v0.1';
export const LARGE_WORLD_MULTI_PROCESS_VERSION = '0.1.0';
export const LARGE_WORLD_MULTI_PROCESS_WORKER_PATH = fileURLToPath(new URL('./multi-process-replication-worker.mjs', import.meta.url));

const clone = value => structuredClone(value);
const text = (value, fallback = '') => String(value ?? fallback);
const keySort = (a, b) => Buffer.compare(Buffer.from(String(a), 'utf8'), Buffer.from(String(b), 'utf8'));
const fail = (condition, code) => { if (!condition) throw new Error(code); };

function processError(code, detail = '') {
  const error = new Error(detail ? `${code}:${detail}` : code);
  error.code = code;
  return error;
}

function normalizeSerializableOptions(options, nodeId) {
  const value = clone(options ?? {});
  value.nodeId = nodeId;
  return JSON.parse(JSON.stringify(value));
}

/**
 * A line-oriented controller for one actual Node.js child process. The child
 * owns its LargeWorldRuntime instance; the parent only transports explicit
 * requests and receives sealed candidate/replication results.
 */
export class LargeWorldProcessNode {
  constructor({nodeId, options = {}, workerPath = LARGE_WORLD_MULTI_PROCESS_WORKER_PATH, command = process.execPath, timeoutMs = 15000, env = null} = {}) {
    this.nodeId = text(nodeId);
    fail(this.nodeId.length > 0, 'MULTI_PROCESS_NODE_ID_REQUIRED');
    this.options = normalizeSerializableOptions(options, this.nodeId);
    this.workerPath = text(workerPath, LARGE_WORLD_MULTI_PROCESS_WORKER_PATH);
    this.command = text(command, process.execPath);
    this.timeoutMs = Number(timeoutMs);
    fail(Number.isSafeInteger(this.timeoutMs) && this.timeoutMs > 0, 'MULTI_PROCESS_TIMEOUT_INVALID');
    this.env = env ? {...env} : null;
    this.child = null;
    this.reader = null;
    this.sequence = 0;
    this.pending = new Map();
    this.protocolErrors = [];
    this.stderr = '';
    this.lastExit = null;
    this.lastPid = null;
    this.exitPromise = null;
    this.resolveExit = null;
  }

  get pid() { return this.child?.pid ?? this.lastPid; }

  get alive() {
    return Boolean(this.child && this.child.exitCode === null && this.child.signalCode === null && !this.child.killed);
  }

  async start() {
    if (this.alive) return this;
    this.protocolErrors = [];
    this.stderr = '';
    this.lastExit = null;
    const child = spawn(this.command, [this.workerPath, JSON.stringify(this.options)], {
      cwd: process.cwd(),
      env: this.env ? {...process.env, ...this.env} : process.env,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    this.child = child;
    this.lastPid = child.pid ?? null;
    this.exitPromise = new Promise(resolve => { this.resolveExit = resolve; });
    this.reader = createInterface({input: child.stdout, crlfDelay: Infinity});
    this.reader.on('line', line => this.#receiveLine(line));
    child.stderr.on('data', chunk => {
      this.stderr = `${this.stderr}${String(chunk)}`.slice(-16 * 1024);
    });
    child.once('error', error => {
      this.lastExit = {code: null, signal: null, error: error.message};
      this.#rejectPending(processError('MULTI_PROCESS_CHILD_ERROR', error.message));
      this.resolveExit?.(this.lastExit);
    });
    child.once('exit', (code, signal) => {
      this.lastExit = {code, signal, stderr: this.stderr || null};
      this.#rejectPending(processError('MULTI_PROCESS_CHILD_EXITED', `${code ?? 'null'}:${signal ?? 'none'}`));
      this.resolveExit?.(this.lastExit);
    });
    await this.request('health');
    return this;
  }

  async request(operation, payload = {}, {timeoutMs = this.timeoutMs} = {}) {
    fail(this.alive, `MULTI_PROCESS_NODE_NOT_RUNNING:${this.nodeId}`);
    const requestId = `${this.nodeId}:${++this.sequence}`;
    const message = {
      protocol: LARGE_WORLD_MULTI_PROCESS_PROTOCOL,
      version: LARGE_WORLD_MULTI_PROCESS_VERSION,
      id: requestId,
      operation: text(operation),
      payload: clone(payload)
    };
    const serialized = `${JSON.stringify(message)}\n`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(processError('MULTI_PROCESS_REQUEST_TIMEOUT', `${this.nodeId}:${operation}`));
      }, timeoutMs);
      this.pending.set(requestId, {resolve, reject, timer});
      try {
        this.child.stdin.write(serialized);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(processError('MULTI_PROCESS_REQUEST_WRITE_FAILED', error.message));
      }
    });
  }

  async waitForExit(timeoutMs = this.timeoutMs) {
    if (!this.child || this.child.exitCode !== null || this.child.signalCode !== null) return this.lastExit;
    let timer;
    await Promise.race([
      this.exitPromise,
      new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); })
    ]);
    if (timer) clearTimeout(timer);
    return this.lastExit;
  }

  async stop({force = false, timeoutMs = this.timeoutMs} = {}) {
    if (!this.child) return this.lastExit;
    if (!force && this.alive) {
      try { await this.request('shutdown', {}, {timeoutMs}); } catch {}
    }
    if (this.alive) this.child.kill();
    await this.waitForExit(timeoutMs);
    this.reader?.close();
    return this.lastExit;
  }

  async restart() {
    await this.stop({force: true});
    return this.start();
  }

  #receiveLine(line) {
    if (!line.trim()) return;
    let message;
    try { message = JSON.parse(line); } catch (error) {
      this.protocolErrors.push(`JSON_PARSE:${error.message}`);
      return;
    }
    const requestId = text(message.id);
    const pending = this.pending.get(requestId);
    if (!pending) return;
    this.pending.delete(requestId);
    clearTimeout(pending.timer);
    if (message.error) {
      const error = processError(text(message.error.code, 'MULTI_PROCESS_REMOTE_ERROR'), text(message.error.message));
      error.remote = clone(message.error);
      pending.reject(error);
    } else pending.resolve(clone(message.result));
  }

  #rejectPending(error) {
    for (const [requestId, pending] of this.pending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pending.delete(requestId);
    }
  }
}

export class MultiProcessReplicationHarness {
  constructor({nodes = [], timeoutMs = 15000, workerPath = LARGE_WORLD_MULTI_PROCESS_WORKER_PATH} = {}) {
    this.nodes = new Map();
    for (const definition of nodes) {
      const node = definition instanceof LargeWorldProcessNode
        ? definition
        : new LargeWorldProcessNode({...definition, timeoutMs: definition.timeoutMs ?? timeoutMs, workerPath: definition.workerPath ?? workerPath});
      fail(!this.nodes.has(node.nodeId), `MULTI_PROCESS_NODE_DUPLICATE:${node.nodeId}`);
      this.nodes.set(node.nodeId, node);
    }
  }

  get size() { return this.nodes.size; }

  node(nodeId) {
    const node = this.nodes.get(text(nodeId));
    fail(node, `MULTI_PROCESS_NODE_UNKNOWN:${nodeId}`);
    return node;
  }

  async start() {
    await Promise.all([...this.nodes.values()].map(node => node.start()));
    return this;
  }

  async request(nodeId, operation, payload = {}, options = {}) {
    return this.node(nodeId).request(operation, payload, options);
  }

  async stop(options = {}) {
    await Promise.all([...this.nodes.values()].map(node => node.stop(options)));
    return this;
  }
}

export function createMultiProcessReplicationEvidence({worldId, nodes = [], snapshotDelta = {}, leaseEpochFencing = {}, failureRecovery = {}, cacheInvalidation = {}, staleWrite = {}, notes = []} = {}) {
  const nodeEvidence = nodes.map(node => ({
    node_id: text(node.node_id ?? node.nodeId),
    independent_process: node.independent_process === true || node.independentProcess === true,
    process_identity_observed: node.process_identity_observed !== false && node.processIdentityObserved !== false
  })).sort((a, b) => keySort(a.node_id, b.node_id));
  const base = {
    format: LARGE_WORLD_MULTI_PROCESS_EVIDENCE_FORMAT,
    version: LARGE_WORLD_MULTI_PROCESS_VERSION,
    world_id: text(worldId),
    node_ids: nodeEvidence.map(node => node.node_id),
    process_count: nodeEvidence.length,
    process_isolation: {
      independent_processes: nodeEvidence.length >= 2 && nodeEvidence.every(node => node.independent_process),
      process_identity_observed: nodeEvidence.every(node => node.process_identity_observed),
      distinct_parent_process: true
    },
    nodes: nodeEvidence,
    snapshot_delta: clone(snapshotDelta),
    lease_epoch_fencing: clone(leaseEpochFencing),
    failure_recovery: clone(failureRecovery),
    cache_invalidation: clone(cacheInvalidation),
    stale_write_rejection: clone(staleWrite),
    notes: [...new Set(notes.map(String))].sort(keySort),
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED',
    authority: {
      canonical_owner: 'RNCS',
      canonical_write_authorized: false,
      provider_can_write_authoritative_world_state: false,
      candidate_only: true,
      authoritative: false,
      commit_status: 'NOT_COMMITTED'
    }
  };
  fail(base.world_id.length > 0, 'MULTI_PROCESS_EVIDENCE_WORLD_ID_REQUIRED');
  return {...base, evidence_root: rootHash(base)};
}

export function verifyMultiProcessReplicationEvidence(evidence) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return {valid: false, errors: ['MULTI_PROCESS_EVIDENCE_NOT_OBJECT']};
  try {
    const copy = clone(evidence);
    const evidenceRoot = copy.evidence_root;
    delete copy.evidence_root;
    check(evidence.format === LARGE_WORLD_MULTI_PROCESS_EVIDENCE_FORMAT, 'MULTI_PROCESS_EVIDENCE_FORMAT_INVALID');
    check(evidence.version === LARGE_WORLD_MULTI_PROCESS_VERSION, 'MULTI_PROCESS_EVIDENCE_VERSION_INVALID');
    check(typeof evidence.world_id === 'string' && evidence.world_id.length > 0, 'MULTI_PROCESS_EVIDENCE_WORLD_ID_REQUIRED');
    check(Array.isArray(evidence.node_ids) && evidence.node_ids.length >= 2, 'MULTI_PROCESS_EVIDENCE_NODE_SET_INVALID');
    check(evidence.process_count === evidence.node_ids?.length, 'MULTI_PROCESS_EVIDENCE_NODE_COUNT_MISMATCH');
    check(evidence.process_isolation?.independent_processes === true, 'MULTI_PROCESS_EVIDENCE_PROCESS_ISOLATION_INVALID');
    check(evidence.process_isolation?.process_identity_observed === true, 'MULTI_PROCESS_EVIDENCE_PROCESS_IDENTITY_INVALID');
    check(evidence.process_isolation?.distinct_parent_process === true, 'MULTI_PROCESS_EVIDENCE_PARENT_PROCESS_INVALID');
    check(evidence.authority?.canonical_owner === 'RNCS', 'MULTI_PROCESS_EVIDENCE_CANONICAL_OWNER_INVALID');
    check(evidence.authority?.canonical_write_authorized === false, 'MULTI_PROCESS_EVIDENCE_CANONICAL_WRITE_ESCALATION');
    check(evidence.authority?.provider_can_write_authoritative_world_state === false, 'MULTI_PROCESS_EVIDENCE_PROVIDER_AUTHORITY_ESCALATION');
    check(evidence.candidate_only === true && evidence.authoritative === false, 'MULTI_PROCESS_EVIDENCE_TOP_LEVEL_AUTHORITY_INVALID');
    check(evidence.commit_status === 'NOT_COMMITTED', 'MULTI_PROCESS_EVIDENCE_TOP_LEVEL_COMMIT_STATUS_INVALID');
    check(evidence.authority?.candidate_only === true && evidence.authority?.authoritative === false, 'MULTI_PROCESS_EVIDENCE_CANDIDATE_BOUNDARY_INVALID');
    check(evidence.authority?.commit_status === 'NOT_COMMITTED', 'MULTI_PROCESS_EVIDENCE_COMMIT_STATUS_INVALID');
    check(typeof evidenceRoot === 'string' && /^[0-9a-f]{64}$/i.test(evidenceRoot) && rootHash(copy) === evidenceRoot, 'MULTI_PROCESS_EVIDENCE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`MULTI_PROCESS_EVIDENCE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, evidence_root: evidence.evidence_root ?? null};
}
