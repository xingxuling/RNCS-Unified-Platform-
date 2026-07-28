import fs from 'node:fs';
import path from 'node:path';
import { clone, nowIso, publicError, randomId, safeFileStem } from '../canonical.mjs';

export const JOB_STATES = Object.freeze(['QUEUED', 'RUNNING', 'WAITING_AUTHORITY', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'ROLLED_BACK']);

function atomicJson(file, value) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

export class JobStore {
  constructor(dataDir) {
    this.dir = path.resolve(dataDir, 'jobs');
    fs.mkdirSync(this.dir, { recursive: true });
    this.jobs = new Map();
    for (const file of fs.readdirSync(this.dir).filter((item) => item.endsWith('.json'))) {
      try {
        const job = JSON.parse(fs.readFileSync(path.join(this.dir, file), 'utf8'));
        if (job?.jobId) {
          if (job.status === 'RUNNING') job.status = 'QUEUED';
          this.jobs.set(job.jobId, job);
        }
      } catch { /* ignore one corrupt job while keeping other persisted jobs readable */ }
    }
  }

  create(kind, input, { maxRetries = 1 } = {}) {
    const job = {
      format: 'turi.job.v0.1', jobId: randomId('job'), kind, input: clone(input), status: 'QUEUED',
      createdAt: nowIso(), updatedAt: nowIso(), retryCount: 0, maxRetries, cancelRequested: false,
      events: [{ at: nowIso(), type: 'created', status: 'QUEUED' }], artifacts: [], result: null, error: null,
    };
    this.jobs.set(job.jobId, job);
    this.save(job);
    return clone(job);
  }

  get(jobId) { return clone(this.jobs.get(jobId) ?? null); }

  listEvents(jobId) { return clone(this.jobs.get(jobId)?.events ?? []); }

  update(jobId, patch = {}) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    Object.assign(job, clone(patch), { updatedAt: nowIso() });
    this.save(job);
    return clone(job);
  }

  event(jobId, type, data = {}) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.events.push({ at: nowIso(), type, ...clone(data) });
    job.updatedAt = nowIso();
    this.save(job);
    return clone(job);
  }

  requestCancel(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    job.cancelRequested = true;
    if (job.status === 'QUEUED') job.status = 'CANCELLED';
    this.event(jobId, 'cancel-requested', { status: job.status });
    return clone(this.jobs.get(jobId));
  }

  save(job) { atomicJson(path.join(this.dir, `${safeFileStem(job.jobId)}.json`), job); }

  summary() {
    const counts = Object.fromEntries(JOB_STATES.map((state) => [state, 0]));
    for (const job of this.jobs.values()) counts[job.status] = (counts[job.status] ?? 0) + 1;
    return { count: this.jobs.size, counts };
  }
}

export class JobManager {
  constructor({ store, workflows, maxTimeoutMs = 30 * 60_000 }) {
    this.store = store;
    this.workflows = workflows;
    this.maxTimeoutMs = maxTimeoutMs;
    this.active = new Map();
  }

  start(kind, input = {}, { timeoutMs = this.maxTimeoutMs } = {}) {
    if (!this.workflows[kind]) {
      const error = new Error(`Unknown job workflow: ${kind}`);
      error.code = 'JOB_WORKFLOW_NOT_FOUND';
      throw error;
    }
    const job = this.store.create(kind, input);
    const boundedTimeout = Math.min(Math.max(Number(timeoutMs) || this.maxTimeoutMs, 1_000), this.maxTimeoutMs);
    this.active.set(job.jobId, { cancel: false });
    this.run(job.jobId, boundedTimeout).catch(() => {});
    return job;
  }

  async run(jobId, timeoutMs) {
    const job = this.store.update(jobId, { status: 'RUNNING', startedAt: nowIso() });
    this.store.event(jobId, 'started', { status: 'RUNNING' });
    const control = this.active.get(jobId) ?? { cancel: false };
    let timeoutHandle;
    const timer = new Promise((_, reject) => { timeoutHandle = setTimeout(() => {
      const error = new Error(`Job exceeded ${timeoutMs}ms.`);
      error.code = 'JOB_TIMEOUT';
      reject(error);
    }, timeoutMs); });
    try {
      const result = await Promise.race([this.workflows[job.kind](job.input, { jobId, control, event: (type, data) => this.store.event(jobId, type, data) }), timer]);
      if (this.store.get(jobId)?.cancelRequested || control.cancel) {
        this.store.update(jobId, { status: 'CANCELLED', result: clone(result), finishedAt: nowIso() });
        this.store.event(jobId, 'cancelled', { status: 'CANCELLED' });
      } else {
        this.store.update(jobId, { status: 'SUCCEEDED', result: clone(result), finishedAt: nowIso() });
        this.store.event(jobId, 'succeeded', { status: 'SUCCEEDED' });
      }
    } catch (error) {
      const normalized = publicError(error, 'JOB_FAILED');
      this.store.update(jobId, { status: normalized.code === 'JOB_TIMEOUT' ? 'FAILED' : 'FAILED', error: normalized, finishedAt: nowIso() });
      this.store.event(jobId, 'failed', { status: 'FAILED', error: normalized });
    } finally {
      clearTimeout(timeoutHandle);
      this.active.delete(jobId);
    }
  }

  cancel(jobId) {
    const active = this.active.get(jobId);
    if (active) active.cancel = true;
    return this.store.requestCancel(jobId);
  }
}
