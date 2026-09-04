import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {clone, GenesisError, rootHash, seal} from './canonical.mjs';
import {
  AssetGenerationJob,
  createAssetProviderManifest,
  createProviderFailure,
  validateAssetProviderManifest
} from './asset-provider-contract.mjs';
import {AssetProviderAdapter, createTrellis2Provider} from './external-asset-providers.mjs';

export const TRELLIS2_LOCAL_PREFLIGHT_FORMAT = 'ragf.trellis2-local-preflight.v0.1';
export const TRELLIS2_LOCAL_PREFLIGHT_VERSION = '0.1.0';
export const TRELLIS2_LOCAL_PROVIDER_ID = 'provider:external:trellis-2:local';

const HASH_PATTERN = /^[a-f0-9]{64}$/u;

const text = value => String(value ?? '').trim();

const asCommand = command => {
  if (Array.isArray(command)) return command.length ? command.map(value => String(value)) : [];
  if (typeof command === 'string' && command.trim()) return [command.trim()];
  return [];
};

const boundedDetail = value => text(value).slice(0, 500);

function safeProbe(probe, fallbackCode, context) {
  try {
    const raw = typeof probe === 'function' ? probe(clone(context)) : probe;
    if (raw === true) return {status: 'PASS', source: 'injected', available: true};
    if (raw === false || raw === undefined || raw === null) {
      return {status: raw === false ? 'BLOCKED' : 'NOT_RUN', source: 'injected', available: false, code: fallbackCode};
    }
    const value = typeof raw === 'object' ? clone(raw) : {available: Boolean(raw)};
    const status = value.status === 'PASS' || value.available === true
      ? 'PASS'
      : value.status === 'NOT_RUN'
        ? 'NOT_RUN'
        : 'BLOCKED';
    return {
      ...value,
      status,
      source: value.source ?? 'injected',
      available: Boolean(value.available ?? status === 'PASS'),
      ...(status !== 'PASS' && !value.code ? {code: fallbackCode} : {})
    };
  } catch (error) {
    return {
      status: 'BLOCKED',
      source: 'injected',
      available: false,
      code: 'PREFLIGHT_PROBE_CRASH',
      detail: boundedDetail(error?.message ?? error)
    };
  }
}

function inspectCommand(command, {commandProbe = null, executorInjected = false, manifest} = {}) {
  const parts = asCommand(command);
  if (!parts.length && executorInjected) {
    return {status: 'PASS', source: 'executor_injected', executable: null, args: [], available: true};
  }
  if (!parts.length) {
    return {status: 'NOT_RUN', source: 'manifest', executable: null, args: [], available: false, code: 'COMMAND_NOT_CONFIGURED'};
  }
  if (commandProbe) {
    const result = safeProbe(commandProbe, 'COMMAND_PROBE_FAILED', {command: parts, manifest});
    return {...result, executable: parts[0], args: parts.slice(1)};
  }
  const executable = parts[0];
  const isPath = path.isAbsolute(executable) || executable.includes('/') || executable.includes('\\');
  if (isPath) {
    const resolved = path.resolve(executable);
    try {
      const stat = fs.statSync(resolved);
      return {
        status: stat.isFile() ? 'PASS' : 'BLOCKED',
        source: 'filesystem',
        executable,
        resolved,
        args: parts.slice(1),
        available: stat.isFile(),
        ...(stat.isFile() ? {} : {code: 'COMMAND_NOT_FILE'})
      };
    } catch (error) {
      return {
        status: 'BLOCKED',
        source: 'filesystem',
        executable,
        resolved,
        args: parts.slice(1),
        available: false,
        code: 'COMMAND_NOT_FOUND',
        detail: boundedDetail(error?.message ?? error)
      };
    }
  }
  const resolver = process.platform === 'win32' ? 'where.exe' : 'which';
  const resolved = spawnSync(resolver, [executable], {encoding: 'utf8', timeout: 2000, maxBuffer: 64 * 1024});
  if (resolved.error?.code === 'ETIMEDOUT') {
    return {status: 'BLOCKED', source: resolver, executable, args: parts.slice(1), available: false, code: 'COMMAND_PROBE_TIMEOUT'};
  }
  const found = resolved.status === 0 && Boolean(text(resolved.stdout));
  return {
    status: found ? 'PASS' : 'BLOCKED',
    source: resolver,
    executable,
    resolved: found ? text(resolved.stdout).split(/\r?\n/u)[0] : null,
    args: parts.slice(1),
    available: found,
    ...(found ? {} : {code: 'COMMAND_NOT_FOUND', detail: boundedDetail(resolved.stderr)})
  };
}

function inspectWeights(weightsPath, suppliedRoot = null) {
  const rawPath = text(weightsPath);
  if (!rawPath) {
    return {status: 'NOT_RUN', source: 'configuration', available: false, code: 'WEIGHTS_NOT_CONFIGURED', path: null};
  }
  const resolved = path.resolve(rawPath);
  try {
    const stat = fs.statSync(resolved);
    const bytes = stat.isFile() ? stat.size : null;
    const entries = stat.isDirectory() ? fs.readdirSync(resolved).length : null;
    const nonEmpty = stat.isFile() ? stat.size > 0 : stat.isDirectory() && entries > 0;
    const metadataFingerprint = rootHash({path: resolved, bytes, entries, mtime_ms: stat.mtimeMs, kind: stat.isDirectory() ? 'directory' : 'file'});
    const weightsRoot = suppliedRoot === null || suppliedRoot === undefined ? null : text(suppliedRoot);
    const suppliedRootValid = weightsRoot === null || HASH_PATTERN.test(weightsRoot);
    return {
      status: nonEmpty && suppliedRootValid ? 'PASS' : 'BLOCKED',
      source: 'filesystem',
      available: nonEmpty && suppliedRootValid,
      path: resolved,
      kind: stat.isDirectory() ? 'directory' : 'file',
      bytes,
      entries,
      content_hash_status: weightsRoot ? 'SUPPLIED_EXTERNAL_ROOT' : 'NOT_COMPUTED',
      weights_root: weightsRoot,
      metadata_fingerprint: metadataFingerprint,
      ...(!nonEmpty ? {code: 'WEIGHTS_EMPTY'} : {}),
      ...(nonEmpty && !suppliedRootValid ? {code: 'WEIGHTS_ROOT_INVALID'} : {})
    };
  } catch (error) {
    return {
      status: 'BLOCKED',
      source: 'filesystem',
      available: false,
      path: resolved,
      code: 'WEIGHTS_NOT_FOUND',
      detail: boundedDetail(error?.message ?? error)
    };
  }
}

function detectCuda(cudaProbe, manifest) {
  if (cudaProbe) return safeProbe(cudaProbe, 'CUDA_UNAVAILABLE', {manifest});
  const result = spawnSync('nvidia-smi', ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'], {
    encoding: 'utf8',
    timeout: 3000,
    maxBuffer: 128 * 1024
  });
  if (result.error?.code === 'ETIMEDOUT') {
    return {status: 'BLOCKED', source: 'nvidia-smi', available: false, code: 'CUDA_PROBE_TIMEOUT'};
  }
  const devices = text(result.stdout).split(/\r?\n/u).map(value => value.trim()).filter(Boolean);
  return {
    status: result.status === 0 && devices.length ? 'PASS' : 'BLOCKED',
    source: 'nvidia-smi',
    available: result.status === 0 && devices.length > 0,
    devices,
    ...(result.status === 0 && devices.length ? {} : {code: 'CUDA_UNAVAILABLE', detail: boundedDetail(result.stderr)})
  };
}

function runProbeCommand(command, timeout) {
  const parts = asCommand(command);
  if (!parts.length) return {status: 'NOT_RUN', source: 'configuration', available: false, code: 'DEPENDENCY_PROBE_NOT_CONFIGURED'};
  const result = spawnSync(parts[0], parts.slice(1), {encoding: 'utf8', timeout, maxBuffer: 256 * 1024});
  if (result.error?.code === 'ETIMEDOUT') return {status: 'BLOCKED', source: 'dependency_command', available: false, code: 'DEPENDENCY_PROBE_TIMEOUT'};
  const available = result.status === 0;
  return {
    status: available ? 'PASS' : 'BLOCKED',
    source: 'dependency_command',
    available,
    stdout: boundedDetail(result.stdout),
    ...(available ? {} : {code: 'DEPENDENCY_PROBE_FAILED', detail: boundedDetail(result.stderr)})
  };
}

function inspectLicense(manifest) {
  const record = manifest.license ?? {};
  const checks = {
    code: record.status === 'VERIFIED' && record.code_status === 'VERIFIED',
    dependencies: record.dependency_status === 'VERIFIED',
    model_weights: record.model_weights_status === 'VERIFIED',
    data: record.data_status === 'VERIFIED',
    release_policy: manifest.commercialPolicy?.default_release_dependency_allowed === true
  };
  const blocked = Object.entries(checks).filter(([, valid]) => !valid).map(([key]) => `LICENSE_${key.toUpperCase()}_NOT_VERIFIED`);
  return {
    status: blocked.length ? 'BLOCKED' : 'PASS',
    source: 'manifest',
    available: blocked.length === 0,
    checks,
    blocked_reasons: blocked
  };
}

function createPreflightReport({manifest, options, runner}) {
  const timeoutMs = Number(options.timeout ?? 60000);
  const command = inspectCommand(manifest.command, {
    commandProbe: options.command_probe ?? options.commandProbe,
    executorInjected: Boolean(runner),
    manifest
  });
  const weights = inspectWeights(options.weights_path ?? options.weightsPath, options.weights_root ?? options.weightsRoot);
  const cuda = detectCuda(options.cuda_probe ?? options.cudaProbe, manifest);
  const dependencies = options.dependency_probe ?? options.dependencyProbe
    ? safeProbe(options.dependency_probe ?? options.dependencyProbe, 'DEPENDENCY_PROBE_FAILED', {manifest})
    : runProbeCommand(options.dependency_command ?? options.dependencyCommand, Math.min(timeoutMs, 5000));
  const license = inspectLicense(manifest);
  const timeout = {
    status: Number.isFinite(timeoutMs) && timeoutMs > 0 ? 'PASS' : 'BLOCKED',
    source: 'configuration',
    available: Number.isFinite(timeoutMs) && timeoutMs > 0,
    timeout_ms: timeoutMs,
    ...(!(Number.isFinite(timeoutMs) && timeoutMs > 0) ? {code: 'TIMEOUT_INVALID'} : {})
  };
  const resultRoot = {
    status: 'PASS',
    source: 'local-normalizer',
    available: true,
    policy: 'provider_supplied_result_root_must_equal_canonical_normalized_result_root'
  };
  const checks = {command, weights, cuda, dependencies, license, timeout, result_root: resultRoot};
  const blockedReasons = [
    ...Object.values(checks).flatMap(check => check.status === 'PASS' ? [] : [check.code, ...(check.blocked_reasons ?? [])].filter(Boolean)),
    ...(command.status === 'NOT_RUN' && !runner ? ['COMMAND_NOT_CONFIGURED'] : []),
    ...(weights.status === 'NOT_RUN' ? ['WEIGHTS_NOT_CONFIGURED'] : []),
    ...(dependencies.status === 'NOT_RUN' ? ['DEPENDENCY_PROBE_NOT_CONFIGURED'] : [])
  ];
  const notRun = Object.entries(checks).filter(([, check]) => check.status === 'NOT_RUN').map(([key]) => key);
  const uniqueBlockedReasons = [...new Set(blockedReasons)].sort();
  return seal({
    format: TRELLIS2_LOCAL_PREFLIGHT_FORMAT,
    version: TRELLIS2_LOCAL_PREFLIGHT_VERSION,
    provider_id: manifest.id,
    provider_root: manifest.manifest_root,
    status: uniqueBlockedReasons.length ? 'BLOCKED' : 'PASS',
    execution_status: uniqueBlockedReasons.length ? 'NOT_RUN' : 'READY_CANDIDATE',
    aaa_status: 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE',
    checks,
    blocked_reasons: uniqueBlockedReasons,
    not_run: notRun,
    authority: {
      canonical_owner: 'RNCS',
      provider_may_emit_candidate: true,
      provider_may_write_authoritative_world_state: false
    },
    preflight_root: ''
  }, 'preflight_root');
}

function createBlockedExecution({manifest, input, report}) {
  const job = new AssetGenerationJob({
    provider: manifest,
    provider_id: manifest.id,
    asset_id: input.asset_id ?? input.genome?.identity?.asset_id,
    candidate_id: input.candidate_id,
    operation: input.operation ?? 'generate',
    quality_tier: input.quality_tier ?? manifest.metadata?.quality_tier ?? 'PRODUCTION',
    genome: input.genome,
    request: input.request,
    seed: input.seed
  });
  job.transition('PREPARING', {preflight_root: report.preflight_root, status: report.status});
  const failure = createProviderFailure({
    provider: manifest,
    job: job.snapshot(),
    code: 'TRELLIS2_PREFLIGHT_BLOCKED',
    detail: {preflight_root: report.preflight_root, blocked_reasons: report.blocked_reasons},
    retryable: report.blocked_reasons.some(code => code.includes('TIMEOUT') || code.includes('NOT_FOUND') || code.includes('UNAVAILABLE'))
  });
  job.fail({code: failure.code, failure_root: failure.failure_root});
  return {status: 'FAILED', provider: clone(manifest), job: job.snapshot(), result: null, failure, preflight: report};
}

export class Trellis2LocalProviderAdapter {
  constructor(manifest, options = {}) {
    const validation = validateAssetProviderManifest(manifest);
    if (!validation.valid) throw new GenesisError('ASSET_PROVIDER_MANIFEST_INVALID', validation.errors.join(','));
    this.manifest = clone(manifest);
    this.options = clone({
      weights_path: options.weights_path ?? options.weightsPath ?? null,
      weights_root: options.weights_root ?? options.weightsRoot ?? null,
      command_probe: null,
      cuda_probe: null,
      dependency_probe: null,
      dependency_command: options.dependency_command ?? options.dependencyCommand ?? null,
      timeout: options.timeout ?? 60000
    });
    this.commandProbe = options.command_probe ?? options.commandProbe ?? null;
    this.cudaProbe = options.cuda_probe ?? options.cudaProbe ?? null;
    this.dependencyProbe = options.dependency_probe ?? options.dependencyProbe ?? null;
    this.runner = options.runner ?? null;
    this.timeout = Number(options.timeout ?? 60000);
    this.adapter = new AssetProviderAdapter(this.manifest, {runner: this.runner, timeout: this.timeout});
  }

  preflight() {
    return createPreflightReport({
      manifest: this.manifest,
      runner: this.runner,
      options: {
        ...this.options,
        command_probe: this.commandProbe,
        cuda_probe: this.cudaProbe,
        dependency_probe: this.dependencyProbe
      }
    });
  }

  healthCheck() {
    const report = this.preflight();
    return {
      status: report.status === 'PASS' ? 'READY' : 'BLOCKED',
      runtime: this.runner ? 'EXECUTOR_INJECTED' : this.manifest.command ? 'EXTERNAL_PROCESS' : 'CONTRACT_ONLY',
      provider_id: this.manifest.id,
      preflight_status: report.status,
      preflight_root: report.preflight_root
    };
  }

  prepare(input = {}) {
    const report = this.preflight();
    return {...this.adapter.prepare(input), preflight_status: report.status, preflight_root: report.preflight_root};
  }

  execute(operation, input = {}) {
    const report = this.preflight();
    if (report.status !== 'PASS') return createBlockedExecution({manifest: this.manifest, input: {...input, operation}, report});
    return {...this.adapter.execute(operation, input), preflight: report};
  }

  generate(input = {}) { return this.execute('generate', input); }

  refine(input = {}) { return this.execute('refine', input); }

  validate(input = {}) { return this.execute('validate', input); }

  cancel(job) { return this.adapter.cancel(job); }
}

export function createTrellis2LocalProvider(options = {}) {
  const base = createTrellis2Provider().manifest;
  const overrides = clone(options.manifest_overrides ?? options.manifestOverrides ?? {});
  const command = options.command ?? overrides.command ?? null;
  const manifest = createAssetProviderManifest({
    ...base,
    ...overrides,
    id: options.provider_id ?? options.providerId ?? overrides.id ?? TRELLIS2_LOCAL_PROVIDER_ID,
    provider_id: options.provider_id ?? options.providerId ?? overrides.provider_id ?? TRELLIS2_LOCAL_PROVIDER_ID,
    name: options.name ?? overrides.name ?? 'Microsoft TRELLIS.2 Local Candidate Adapter',
    command,
    runtimeStatus: command ? 'CONFIGURED' : 'CONTRACT_ONLY',
    metadata: {
      ...base.metadata,
      ...overrides.metadata,
      local_adapter: true,
      runtime_evidence: 'NOT_RUN',
      weights_bundled: false,
      canonical_world_owner: 'RNCS'
    }
  });
  return new Trellis2LocalProviderAdapter(manifest, options);
}

export function preflightTrellis2LocalProvider(options = {}) {
  return createTrellis2LocalProvider(options).preflight();
}
