import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { RemoteLinkError, now } from '../shared/canonical.mjs';

const execFileAsync = promisify(execFile);

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function cpuTotals() {
  const cpus = os.cpus() || [];
  let total = 0;
  let idle = 0;
  for (const cpu of cpus) {
    for (const value of Object.values(cpu.times || {})) total += finite(value);
    idle += finite(cpu.times?.idle);
  }
  return { total, idle, cpus };
}

function networkSummary() {
  const out = [];
  for (const [name, values] of Object.entries(os.networkInterfaces() || {})) {
    const families = [...new Set((values || []).filter((v) => !v.internal).map((v) => v.family))];
    if (families.length) out.push({ name, families });
  }
  return out;
}

function storageSummary() {
  try {
    const root = path.parse(process.cwd()).root || '/';
    const info = fs.statfsSync(root);
    const blockSize = finite(info.bsize, 1);
    const total = finite(info.blocks) * blockSize;
    const available = finite(info.bavail) * blockSize;
    return {
      root,
      total_bytes: total,
      available_bytes: available,
      used_bytes: Math.max(0, total - available),
      used_ratio: total > 0 ? Math.max(0, Math.min(1, (total - available) / total)) : null,
    };
  } catch (error) {
    return { status: 'unavailable', error: error?.code || error?.name || 'STATFS_FAILED' };
  }
}

export class DesktopDeviceRuntime {
  constructor(policy = {}) {
    this.policy = policy;
    this.startedAt = Date.now();
    this.lastCpu = cpuTotals();
    this.cachedSnapshot = null;
    this.cachedAt = 0;
  }

  snapshot() {
    const nowMs = Date.now();
    if (this.cachedSnapshot && nowMs - this.cachedAt < 500) return this.cachedSnapshot;

    const cpuNow = cpuTotals();
    const deltaTotal = Math.max(0, cpuNow.total - this.lastCpu.total);
    const deltaIdle = Math.max(0, cpuNow.idle - this.lastCpu.idle);
    const busyRatio = deltaTotal > 0 ? Math.max(0, Math.min(1, 1 - deltaIdle / deltaTotal)) : null;
    this.lastCpu = cpuNow;

    const total = os.totalmem();
    const free = os.freemem();
    const cpus = cpuNow.cpus;
    const snapshot = {
      format: 'dml.device-projection.v0.4',
      captured_at: now(),
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      os_type: os.type(),
      os_release: os.release(),
      uptime_seconds: Math.floor(os.uptime()),
      host_runtime_uptime_seconds: Math.floor((Date.now() - this.startedAt) / 1000),
      memory: {
        total_bytes: total,
        free_bytes: free,
        used_bytes: Math.max(0, total - free),
        used_ratio: total > 0 ? Math.max(0, Math.min(1, (total - free) / total)) : null,
      },
      storage: storageSummary(),
      cpu: {
        logical_count: cpus.length,
        model: cpus[0]?.model || null,
        average_mhz: cpus.length ? Math.round(cpus.reduce((a, c) => a + finite(c.speed), 0) / cpus.length) : null,
        busy_ratio: busyRatio,
        load_average: os.loadavg(),
        sampling: busyRatio === null ? 'warming' : 'delta-since-previous-snapshot',
      },
      network_interfaces: networkSummary(),
      capabilities: {
        inspect: true,
        process_list: Boolean(this.policy.allow_process_list),
        app_launch: Object.keys(this.policy.allowed_apps || {}).length > 0,
        command_profiles: Object.keys(this.policy.command_profiles || {}).length,
        open_url: this.policy.allow_open_url === true,
      },
    };
    this.cachedSnapshot = snapshot;
    this.cachedAt = nowMs;
    return snapshot;
  }

  async execute(action) {
    switch (action.type) {
      case 'dml.device.inspect':
        return this.result('ok', { device: this.snapshot() });
      case 'dml.device.process.list':
        return this.processList();
      case 'dml.device.app.launch':
        return this.launchApp(action);
      case 'dml.device.command.run':
        return this.runCommandProfile(action);
      case 'dml.device.url.open':
        return this.openUrl(action);
      default:
        throw new RemoteLinkError('DEVICE_ACTION_UNSUPPORTED', `Unsupported device action: ${action.type}`, 400);
    }
  }

  result(status, payload = {}) {
    return {
      status,
      provider: 'dml.desktop-device-runtime.v0.4',
      completed_at: now(),
      ...payload,
      projection: this.snapshot(),
    };
  }

  async processList() {
    if (!this.policy.allow_process_list) throw new RemoteLinkError('DEVICE_PROCESS_LIST_DENIED', 'Process listing is disabled by host policy', 403);
    const command = process.platform === 'win32' ? 'tasklist.exe' : 'ps';
    const args = process.platform === 'win32' ? ['/fo', 'csv', '/nh'] : ['-eo', 'pid=,comm='];
    const { stdout } = await execFileAsync(command, args, { timeout: 4000, windowsHide: true, maxBuffer: 512 * 1024 });
    return this.result('ok', { processes_text: String(stdout).slice(0, 120_000) });
  }

  launchApp(action) {
    const appId = String(action.payload?.app_id || action.app_id || '');
    const spec = this.policy.allowed_apps?.[appId];
    if (!appId || !spec) throw new RemoteLinkError('DEVICE_APP_DENIED', `App is not mapped in host policy: ${appId || 'missing'}`, 403);
    const file = String(spec.executable || '');
    if (!file) throw new RemoteLinkError('DEVICE_APP_CONFIG_INVALID', `No executable mapped for ${appId}`, 500);
    const args = Array.isArray(spec.args) ? spec.args.map(String) : [];
    const child = spawn(file, args, {
      cwd: spec.cwd ? path.resolve(String(spec.cwd)) : undefined,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      shell: false,
    });
    child.unref();
    return this.result('accepted', { action: 'app.launch', app_id: appId, pid: child.pid || null });
  }

  async runCommandProfile(action) {
    const profileId = String(action.payload?.profile_id || action.profile_id || '');
    const profile = this.policy.command_profiles?.[profileId];
    if (!profileId || !profile) throw new RemoteLinkError('DEVICE_COMMAND_PROFILE_DENIED', `Command profile is not mapped: ${profileId || 'missing'}`, 403);
    const file = String(profile.executable || '');
    if (!file) throw new RemoteLinkError('DEVICE_COMMAND_PROFILE_INVALID', `No executable configured for ${profileId}`, 500);
    const args = Array.isArray(profile.args) ? profile.args.map(String) : [];
    const timeout = Math.max(500, Math.min(120_000, finite(profile.timeout_ms, 30_000)));
    const cwd = profile.cwd ? path.resolve(String(profile.cwd)) : undefined;
    const { stdout, stderr } = await execFileAsync(file, args, {
      cwd,
      timeout,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
      shell: false,
    });
    return this.result('ok', {
      action: 'command.run',
      profile_id: profileId,
      stdout: String(stdout).slice(0, 250_000),
      stderr: String(stderr).slice(0, 100_000),
    });
  }

  openUrl(action) {
    if (this.policy.allow_open_url !== true) throw new RemoteLinkError('DEVICE_OPEN_URL_DENIED', 'Opening URLs is disabled by host policy', 403);
    const raw = String(action.payload?.url || action.url || '');
    let url;
    try { url = new URL(raw); } catch { throw new RemoteLinkError('DEVICE_URL_INVALID', 'URL is invalid', 400); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new RemoteLinkError('DEVICE_URL_SCHEME_DENIED', 'Only http/https URLs are allowed', 403);
    let file; let args;
    if (process.platform === 'win32') {
      file = 'rundll32.exe';
      args = ['url.dll,FileProtocolHandler', url.toString()];
    } else if (process.platform === 'darwin') {
      file = 'open'; args = [url.toString()];
    } else {
      file = 'xdg-open'; args = [url.toString()];
    }
    const child = spawn(file, args, { detached: true, stdio: 'ignore', shell: false, windowsHide: false });
    child.unref();
    return this.result('accepted', { action: 'url.open', url: url.toString(), pid: child.pid || null });
  }
}
