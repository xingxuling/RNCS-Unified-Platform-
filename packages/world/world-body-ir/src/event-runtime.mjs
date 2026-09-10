import {
  canonicalClone,
  compareUtf8,
  semanticHash,
  verifyWorldBodyIR,
} from './index.mjs';

export const WORLD_BODY_EVENT_DELIVERY_PLAN_FORMAT = 'taowind.world-body-event-delivery-plan.v0.1';
export const WORLD_BODY_EVENT_RUNTIME_FORMAT = 'taowind.world-body-event-runtime.v0.1';
export const WORLD_BODY_EVENT_RUNTIME_VERSION = '0.1.0-alpha.1';

export class WorldBodyEventRuntimeError extends Error {
  constructor(code, message, details = undefined) {
    super(`${code}: ${message}`);
    this.name = 'WorldBodyEventRuntimeError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details = undefined) {
  throw new WorldBodyEventRuntimeError(code, message, details);
}

function clone(value) {
  return structuredClone(value);
}

function requiredTick(value) {
  if (!Number.isSafeInteger(value) || value < 0) fail('WORLD_BODY_EVENT_TICK_INVALID', 'Event runtime tick must be a non-negative safe integer', { value });
  return value;
}

function normalizeProvider(consumer, provider) {
  if (typeof provider === 'function') return { providerId: `${consumer}:provider`, deliver: provider };
  if (provider && typeof provider === 'object' && typeof provider.deliver === 'function') {
    return { providerId: String(provider.providerId ?? `${consumer}:provider`), deliver: provider.deliver };
  }
  fail('WORLD_BODY_EVENT_PROVIDER_INVALID', `Provider for ${consumer} must be a function or { providerId, deliver } object`);
}

export function createWorldBodyEventDeliveryPlan(ir) {
  const verification = verifyWorldBodyIR(ir);
  if (!verification.ok) fail('WORLD_BODY_EVENT_IR_INVALID', 'Event delivery planning requires a verified World Body IR', { diagnostics: verification.diagnostics });
  const deliveries = ir.worldEventState.events.flatMap(event => event.routes.map(route => ({
    eventId: event.id,
    eventKind: event.kind,
    tick: event.tick,
    sequence: event.sequence,
    routeId: route.id,
    consumer: route.consumer,
    target: route.target,
    sourceAuthorityRoot: event.sourceAuthorityRoot,
    deliveryKey: `${event.exactlyOnceKey}:${route.id}`,
  })));
  const ordered = deliveries.sort((left, right) => compareUtf8(left.deliveryKey, right.deliveryKey));
  const base = {
    format: WORLD_BODY_EVENT_DELIVERY_PLAN_FORMAT,
    sourceWorldBodyRoot: ir.roots.worldBodyRoot,
    deliveries: ordered,
  };
  return canonicalClone({ ...base, deliveryPlanRoot: semanticHash(base) });
}

function deliveryReceipt({ delivery, status, providerId, attempt }) {
  return {
    deliveryKey: delivery.deliveryKey,
    eventId: delivery.eventId,
    eventKind: delivery.eventKind,
    routeId: delivery.routeId,
    consumer: delivery.consumer,
    target: delivery.target,
    tick: delivery.tick,
    sequence: delivery.sequence,
    status,
    providerId: providerId ?? null,
    attempt,
  };
}

export class WorldBodyEventRuntime {
  constructor({ ir, providers = {} } = {}) {
    const verification = verifyWorldBodyIR(ir);
    if (!verification.ok) fail('WORLD_BODY_EVENT_IR_INVALID', 'Event runtime requires a verified World Body IR', { diagnostics: verification.diagnostics });
    this.ir = canonicalClone(ir);
    this.plan = createWorldBodyEventDeliveryPlan(this.ir);
    this.providers = new Map();
    this.delivered = new Set();
    this.attempts = new Map();
    for (const [consumer, provider] of Object.entries(providers)) this.setProvider(consumer, provider);
  }

  setProvider(consumer, provider) {
    this.providers.set(String(consumer), normalizeProvider(String(consumer), provider));
    return this;
  }

  removeProvider(consumer) {
    this.providers.delete(String(consumer));
    return this;
  }

  dispatchTick(tick) {
    const targetTick = requiredTick(tick);
    const receipts = [];
    for (const delivery of this.plan.deliveries.filter(item => item.tick === targetTick)) {
      const attempt = (this.attempts.get(delivery.deliveryKey) ?? 0) + 1;
      this.attempts.set(delivery.deliveryKey, attempt);
      if (this.delivered.has(delivery.deliveryKey)) {
        receipts.push(deliveryReceipt({ delivery, status: 'duplicate-suppressed', attempt }));
        continue;
      }
      const provider = this.providers.get(delivery.consumer);
      if (!provider) {
        receipts.push(deliveryReceipt({ delivery, status: 'blocked-provider', attempt }));
        continue;
      }
      try {
        const result = provider.deliver({ delivery: clone(delivery), sourceWorldBodyRoot: this.plan.sourceWorldBodyRoot });
        const accepted = result === undefined || result === true || result?.status === undefined || result?.status === 'delivered';
        if (accepted) {
          this.delivered.add(delivery.deliveryKey);
          receipts.push(deliveryReceipt({ delivery, status: 'delivered', providerId: result?.providerId ?? provider.providerId, attempt }));
        } else {
          receipts.push(deliveryReceipt({ delivery, status: 'provider-rejected', providerId: result?.providerId ?? provider.providerId, attempt }));
        }
      } catch (error) {
        receipts.push(deliveryReceipt({ delivery, status: 'provider-error', providerId: provider.providerId, attempt }));
      }
    }
    const base = {
      format: WORLD_BODY_EVENT_RUNTIME_FORMAT,
      version: WORLD_BODY_EVENT_RUNTIME_VERSION,
      sourceWorldBodyRoot: this.plan.sourceWorldBodyRoot,
      deliveryPlanRoot: this.plan.deliveryPlanRoot,
      tick: targetTick,
      receipts,
      deliveredCount: this.delivered.size,
      pendingCount: this.plan.deliveries.filter(item => !this.delivered.has(item.deliveryKey)).length,
    };
    return canonicalClone({ ...base, receiptRoot: semanticHash(base) });
  }

  dispatchAll() {
    return [...new Set(this.plan.deliveries.map(item => item.tick))]
      .sort((left, right) => left - right)
      .map(tick => this.dispatchTick(tick));
  }

  snapshot() {
    const base = {
      format: WORLD_BODY_EVENT_RUNTIME_FORMAT,
      version: WORLD_BODY_EVENT_RUNTIME_VERSION,
      sourceWorldBodyRoot: this.plan.sourceWorldBodyRoot,
      deliveryPlanRoot: this.plan.deliveryPlanRoot,
      deliveredKeys: [...this.delivered].sort(compareUtf8),
      attempts: [...this.attempts.entries()].sort(([left], [right]) => compareUtf8(left, right)).map(([deliveryKey, count]) => ({ deliveryKey, count })),
    };
    return canonicalClone({ ...base, stateRoot: semanticHash(base) });
  }

  reset() {
    this.delivered.clear();
    this.attempts.clear();
    return this;
  }
}

export function createWorldBodyEventRuntime(options = {}) {
  return new WorldBodyEventRuntime(options);
}
