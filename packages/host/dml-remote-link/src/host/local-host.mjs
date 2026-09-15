import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DMLRuntime } from '@taowind/dml-core-runtime';
import { makeExecutionReceipt, verifyQueuedAction } from '../shared/protocol.mjs';
import { now, sleep } from '../shared/canonical.mjs';
import { HostState } from './state.mjs';
import { enforceHostPolicy, loadHostPolicy } from './policy.mjs';
import { pairHost, signedHostRequest } from './transport.mjs';
import { DesktopDeviceRuntime } from './device-runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '../..');

export class DMLLocalHost {
  constructor({
    stateDir = 'state/host',
    policyFile = null,
    dmlStateDir = null,
    pollWaitSeconds = 20,
    heartbeatMs = 20_000,
  } = {}) {
    this.state = new HostState(stateDir);
    this.policy = loadHostPolicy(policyFile);
    this.dmlStateDir = path.resolve(dmlStateDir || path.join(this.state.root, 'dml-core'));
    this.runtime = new DMLRuntime({ stateDir: this.dmlStateDir });
    this.deviceRuntime = new DesktopDeviceRuntime(this.policy);
    this.pollWaitSeconds = pollWaitSeconds;
    this.heartbeatMs = heartbeatMs;
    this.running = false;
    this.lastSequence = 0;
    this.lastHeartbeatAt = 0;
  }

  static async pair({ relayUrl, sessionId, pairCode, stateDir = 'state/host', hostId = null }) {
    const state = new HostState(stateDir);
    const resolvedHostId = hostId || `host:${os.hostname().toLowerCase()}`;
    const result = await pairHost({
      relayUrl,
      sessionId,
      pairCode,
      hostId: resolvedHostId,
      publicKeyPem: state.keys.publicKeyPem,
      metadata: {
        runtime: 'dml.local-host.v0.4',
        hnac_execution_fabric: '0.8.0',
        device_runtime: 'dml.desktop-device-runtime.v0.4',
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
        node: process.version,
      },
    });
    state.saveConfig({
      format: 'dml.local-host-config.v0.4',
      relay_url: relayUrl,
      session_id: sessionId,
      host_id: resolvedHostId,
      relay_public_key_pem: result.relay_public_key_pem,
      protocol: result.protocol,
    });
    return { ...result, host_id: resolvedHostId, state_dir: state.root };
  }

  config() {
    return this.state.readConfig();
  }

  async signed(tail, { method = 'GET', body = null } = {}) {
    const config = this.config();
    return signedHostRequest({
      relayUrl: config.relay_url,
      sessionId: config.session_id,
      hostId: config.host_id,
      privateKeyPem: this.state.keys.privateKeyPem,
      method,
      tail,
      body,
    });
  }

  project() {
    return {
      format: 'dml.remote-host-projection.v0.4',
      projected_at: now(),
      dml: this.runtime.project(),
      device: this.deviceRuntime.snapshot(),
    };
  }

  health() {
    return {
      status: this.running ? 'online' : 'idle',
      protocol: 'dml.local-host.v0.4',
      hnac_execution_fabric: '0.8.0',
      dml_core: this.runtime.health(),
      device: this.deviceRuntime.snapshot(),
      state_dir: this.state.root,
      dml_state_dir: this.dmlStateDir,
      package_root: packageRoot,
      last_sequence: this.lastSequence,
    };
  }

  async heartbeat(force = false) {
    if (!force && Date.now() - this.lastHeartbeatAt < this.heartbeatMs) return null;
    this.lastHeartbeatAt = Date.now();
    return this.signed('/host/heartbeat', {
      method: 'POST',
      body: {
        format: 'dml.remote-heartbeat.v0.4',
        sent_at: now(),
        health: this.health(),
        projection: this.project(),
      },
    });
  }

  async executeEnvelope(rawEnvelope) {
    const config = this.config();
    const verified = verifyQueuedAction(rawEnvelope, config.relay_public_key_pem, config.session_id);
    const envelope = enforceHostPolicy(verified, this.policy);
    const existing = this.state.receipt(envelope.action_id);
    if (existing) return existing;

    const startedAt = now();
    let execution;
    let projection;
    try {
      if (String(envelope.action?.type || '').startsWith('dml.device.')) {
        execution = await this.deviceRuntime.execute(envelope.action);
      } else {
        execution = await this.runtime.execute(envelope.action, envelope.options || {});
      }
      projection = this.project();
      execution = { ...execution, projection };
    } catch (error) {
      projection = this.project();
      execution = {
        status: 'error',
        error: { code: error.code || 'DML_EXECUTION_FAILED', message: error.message || String(error) },
        projection,
      };
    }
    const completedAt = now();
    const receipt = makeExecutionReceipt({
      sessionId: config.session_id,
      hostId: config.host_id,
      queuedAction: envelope,
      execution,
      projection,
      startedAt,
      completedAt,
      privateKeyPem: this.state.keys.privateKeyPem,
    });
    this.state.saveReceipt(envelope.action_id, receipt);
    return receipt;
  }

  async runOnce() {
    const batch = await this.signed(`/host/actions?after=${this.lastSequence}&wait=${this.pollWaitSeconds}`);
    for (const envelope of batch.actions || []) {
      const receipt = await this.executeEnvelope(envelope);
      await this.signed('/host/result', { method: 'POST', body: receipt });
      this.lastSequence = Math.max(this.lastSequence, Number(envelope.sequence || 0));
    }
    await this.heartbeat(false);
    return { actions: batch.actions?.length || 0, last_sequence: this.lastSequence };
  }

  async run({ signal = null, onStatus = null } = {}) {
    this.running = true;
    await this.heartbeat(true);
    let failures = 0;
    while (this.running && !signal?.aborted) {
      try {
        const result = await this.runOnce();
        failures = 0;
        onStatus?.({ type: 'cycle', ...result, at: now() });
      } catch (error) {
        failures += 1;
        onStatus?.({ type: 'error', code: error.code || 'HOST_LOOP_ERROR', message: error.message, failures, at: now() });
        await sleep(Math.min(30_000, 500 * (2 ** Math.min(failures, 6))));
      }
    }
    this.running = false;
  }

  stop() {
    this.running = false;
  }
}
