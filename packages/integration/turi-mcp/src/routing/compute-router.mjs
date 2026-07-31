import { randomId } from '../canonical.mjs';

const TASK_PROFILES = Object.freeze({
  research: {
    defaultDeadlineMs: 120_000,
    phases: ['updia.native-rgr', 'host.reasoning'],
    providers: ['updia.native-rgr', 'host.reasoning'],
    requiredInputs: [],
  },
  world_simulation: {
    defaultDeadlineMs: 180_000,
    defaultTicks: 100,
    phases: ['host.reasoning', 'rcl.compiler', 'gamebrain.world-simulator'],
    providers: ['gamebrain.world-simulator', 'rncs.candidate-simulator'],
    requiredInputs: ['seed'],
  },
  formal_compile: {
    defaultDeadlineMs: 120_000,
    phases: ['host.reasoning', 'rcl.compiler'],
    providers: ['rcl.compiler'],
    requiredInputs: ['source'],
  },
  candidate_simulation: {
    defaultDeadlineMs: 180_000,
    defaultTicks: 100,
    phases: ['rcl.compiler', 'rncs.candidate-simulator'],
    providers: ['rncs.candidate-simulator'],
    requiredInputs: ['source'],
  },
  general: {
    defaultDeadlineMs: 120_000,
    phases: ['host.reasoning'],
    providers: ['host.reasoning'],
    requiredInputs: [],
  },
});

const boundedInteger = (value, fallback, min, max) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(Math.max(number, min), max);
};

function safeConfigured(adapter) {
  try { return Boolean(adapter?.configured?.()); } catch { return false; }
}

function safeGameBrainStatus(adapter) {
  try {
    return adapter?.status?.() ?? { configured: false, implementation: 'provider', limitations: ['GameBrain adapter is unavailable.'] };
  } catch (error) {
    return { configured: false, implementation: 'provider', limitations: [error.message], errorCode: error.code ?? 'GAMEBRAIN_STATUS_FAILED' };
  }
}

export class ComputeRouter {
  constructor({ config = {}, adapters = {} } = {}) {
    this.config = config;
    this.adapters = adapters;
    this.policyVersion = 'turi.compute-router.v0.1';
  }

  resourceSnapshot() {
    const gamebrain = safeGameBrainStatus(this.adapters.gamebrain);
    const localGeneration = this.config.reasoningMode === 'local' && Boolean(this.config.updiaDefaultModel);
    return {
      format: 'turi.compute-resource-health.v0.1',
      policyVersion: this.policyVersion,
      generatedAt: new Date().toISOString(),
      resources: [
        { resourceId: 'host.reasoning', kind: 'reasoning', state: 'ready', available: true, primary: true },
        { resourceId: 'updia.native-rgr', kind: 'evidence_retrieval', state: safeConfigured(this.adapters.updia) ? 'ready' : 'unavailable', available: safeConfigured(this.adapters.updia), primary: false },
        { resourceId: 'rcl.compiler', kind: 'formal_compile', state: this.adapters.rcl ? 'ready' : 'unavailable', available: Boolean(this.adapters.rcl), primary: false },
        { resourceId: 'rncs.candidate-simulator', kind: 'candidate_simulation', state: this.adapters.rncs ? 'ready' : 'unavailable', available: Boolean(this.adapters.rncs), primary: false },
        {
          resourceId: 'gamebrain.world-simulator',
          kind: 'world_simulation',
          state: gamebrain.configured ? 'ready' : 'unavailable',
          available: Boolean(gamebrain.configured),
          primary: false,
          provider: 'worldseed-gamebrain',
          limits: { maxTicks: 10_000 },
          limitations: gamebrain.limitations ?? [],
        },
        {
          resourceId: 'ollama.generation',
          kind: 'local_generation',
          state: localGeneration ? 'explicit_fallback' : 'disabled_in_primary_path',
          available: localGeneration,
          primary: false,
          implicit: false,
        },
      ],
    };
  }

  summary() {
    const snapshot = this.resourceSnapshot();
    return {
      format: snapshot.format,
      policyVersion: this.policyVersion,
      primaryReasoner: 'host.reasoning',
      resourceCount: snapshot.resources.length,
      availableResources: snapshot.resources.filter((resource) => resource.available).map((resource) => resource.resourceId),
      gamebrain: snapshot.resources.find((resource) => resource.resourceId === 'gamebrain.world-simulator'),
      implicitOllamaGeneration: false,
    };
  }

  health() { return this.resourceSnapshot(); }

  route(input = {}) {
    const taskType = String(input.taskType ?? 'general').trim().toLowerCase();
    const profile = TASK_PROFILES[taskType];
    if (!profile) {
      const error = new Error(`Unsupported compute task type: ${taskType}`);
      error.code = 'COMPUTE_TASK_TYPE_UNSUPPORTED';
      throw error;
    }

    const seed = String(input.seed ?? '').trim();
    const source = String(input.source ?? '').trim();
    const budget = {
      deadlineMs: boundedInteger(input.deadlineMs, profile.defaultDeadlineMs, 1_000, 1_800_000),
      ticks: boundedInteger(input.ticks, profile.defaultTicks ?? null, 1, 10_000),
      actors: input.actors === undefined ? null : boundedInteger(input.actors, null, 1, 1_000_000),
    };
    const snapshot = this.resourceSnapshot();
    const byId = new Map(snapshot.resources.map((resource) => [resource.resourceId, resource]));
    const requiredInputs = profile.requiredInputs.filter((key) => !String(input[key] ?? '').trim());
    const candidates = profile.providers.map((resourceId, index) => {
      const resource = byId.get(resourceId);
      return {
        resourceId,
        priority: index + 1,
        available: Boolean(resource?.available),
        state: resource?.state ?? 'unavailable',
        reason: resource?.available ? 'eligible' : 'resource_unavailable',
      };
    });

    let decision = {
      status: 'resource_unavailable',
      selectedResource: null,
      code: 'COMPUTE_RESOURCE_UNAVAILABLE',
      message: 'No eligible compute resource is available for this task.',
    };
    if (requiredInputs.length) {
      decision = {
        status: 'needs_input',
        selectedResource: null,
        code: 'COMPUTE_REQUIRED_INPUT_MISSING',
        message: `Missing required compute input: ${requiredInputs.join(', ')}.`,
      };
    } else if (taskType === 'world_simulation') {
      const gamebrain = byId.get('gamebrain.world-simulator');
      if (gamebrain?.available) {
        decision = {
          status: 'selected',
          selectedResource: 'gamebrain.world-simulator',
          code: 'GAMEBRAIN_SELECTED',
          message: 'GameBrain is selected as the bounded world simulation provider.',
        };
      } else {
        decision = {
          status: 'resource_unavailable',
          selectedResource: null,
          code: 'GAMEBRAIN_NOT_CONFIGURED',
          message: 'GameBrain is not configured; no implicit Ollama or silent provider substitution is allowed.',
        };
      }
    } else {
      const selected = candidates.find((candidate) => candidate.available);
      if (selected) {
        decision = {
          status: selected.priority === 1 ? 'selected' : 'degraded',
          selectedResource: selected.resourceId,
          code: selected.priority === 1 ? 'COMPUTE_RESOURCE_SELECTED' : 'COMPUTE_FALLBACK_SELECTED',
          message: selected.priority === 1 ? 'Preferred compute path selected.' : 'Preferred resource is unavailable; an explicit typed fallback is selected.',
        };
      }
    }

    return {
      format: 'turi.compute-route.v0.1',
      policyVersion: this.policyVersion,
      routeId: randomId('route'),
      taskType,
      phases: profile.phases,
      decision,
      budget: {
        ...budget,
        deadlineAt: new Date(Date.now() + budget.deadlineMs).toISOString(),
      },
      requiredInputs: profile.requiredInputs,
      candidates,
      fallbackPolicy: 'explicit_only_no_implicit_ollama',
      evidenceContract: {
        required: ['routeId', 'resourceId', 'durationMs', 'inputHash', 'outputHash'],
        worldSimulation: ['seedHash', 'ticks', 'stateHash_or_snapshot_hash', 'replay_status'],
      },
      resourceSnapshot: snapshot,
      limitations: [
        ...(decision.status === 'resource_unavailable' ? [decision.message] : []),
        ...(taskType === 'world_simulation' ? ['GameBrain simulation is a provider execution, not a knowledge or evidence source.'] : []),
      ],
      inputProfile: { hasSeed: Boolean(seed), hasSource: Boolean(source), reasoningMode: input.reasoningMode ?? this.config.reasoningMode ?? 'host' },
    };
  }
}

export { TASK_PROFILES };
