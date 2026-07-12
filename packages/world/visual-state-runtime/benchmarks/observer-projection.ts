import { mkdirSync, writeFileSync } from 'node:fs';
import { VSRRuntimeSession } from '../packages/core/src/index.js';
import {
  prepareObserverProjection,
  projectDisplayForObserver,
  verifyObserverProjectionSet,
  type VSRObserverProfile,
} from '../packages/observer-projection/src/index.js';
import type { VSRDocument, VSRNode } from '../packages/spec/src/index.js';

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}

const observers: VSRObserverProfile[] = [
  { format: 'vsr.observer-profile.v0.1', observerId: 'owner', roles: ['owner'], scopes: ['public.read', 'private.read', 'evidence.read', 'diagnostics.read'], clearance: 4 },
  { format: 'vsr.observer-profile.v0.1', observerId: 'operator', roles: ['operator'], scopes: ['public.read', 'private.read', 'diagnostics.read'], clearance: 3 },
  { format: 'vsr.observer-profile.v0.1', observerId: 'auditor', roles: ['auditor'], scopes: ['public.read', 'evidence.read', 'diagnostics.read'], clearance: 3 },
  { format: 'vsr.observer-profile.v0.1', observerId: 'guest', roles: ['guest'], scopes: ['public.read'], clearance: 0 },
];

const nodes: VSRNode[] = [];
for (let groupIndex = 0; groupIndex < 50; groupIndex++) {
  const groupId = `group-${groupIndex}`;
  nodes.push({
    id: groupId,
    type: 'group',
    layout: { x: 0, y: 0, width: 1920, height: 1080 },
    ...(groupIndex % 5 === 0 ? { extensions: { 'vsr:observer-policy': { format: 'vsr.observer-policy.v0.1', anyScope: ['private.read'], deny: 'hide', reason: 'private-branch' } } } : {}),
  });
  for (let childIndex = 0; childIndex < 20; childIndex++) {
    const index = groupIndex * 20 + childIndex;
    nodes.push({
      id: `node-${index}`,
      parentId: groupId,
      type: index % 4 === 0 ? 'text' : 'rect',
      layout: { x: (index % 50) * 34, y: Math.floor(index / 50) * 30, width: 30, height: 24 },
      appearance: { fill: { type: 'solid', color: '#4d9cff' } },
      ...(index % 4 === 0 ? { content: { text: `Node ${index}`, fontSize: 12 } } : { content: { cornerRadius: 4 } }),
      ...(index % 17 === 0 ? { extensions: { 'vsr:observer-policy': { format: 'vsr.observer-policy.v0.1', anyScope: ['evidence.read'], minClearance: 3, deny: 'redact', redactionText: 'MASKED', reason: 'evidence-node' } } } : {}),
    } as VSRNode);
  }
}

const document: VSRDocument = {
  specVersion: '0.1',
  runtimeTarget: 'vsr@0.1.0-alpha.12',
  metadata: { id: 'observer-benchmark', title: 'Observer Projection Benchmark', duration: 1, defaultFps: 60, seed: 20260630 },
  canvas: { width: 1920, height: 1080, background: { type: 'solid', color: '#07111f' } },
  nodes,
};

const runtime = new VSRRuntimeSession(document);
const source = runtime.evaluate(0).displayState;
const plan = prepareObserverProjection(document);
const invariant = { realityId: 'benchmark-reality', generation: 1, stateRoot: source.semanticHash };

for (let i = 0; i < 50; i++) for (const observer of observers) projectDisplayForObserver(plan, source, observer, { invariant });
const samples: number[] = [];
let final = observers.map(observer => projectDisplayForObserver(plan, source, observer, { invariant }));
for (let run = 0; run < 80; run++) {
  const started = performance.now();
  final = observers.map(observer => projectDisplayForObserver(plan, source, observer, { invariant }));
  samples.push(performance.now() - started);
}
const verification = verifyObserverProjectionSet(final);
const report = {
  runtime: 'vsr@0.1.0-alpha.12',
  nodeCount: document.nodes.length,
  visibleItemCount: source.items.length,
  observerCount: observers.length,
  runs: samples.length,
  totalProjectionMedianMs: percentile(samples, 0.5),
  totalProjectionP95Ms: percentile(samples, 0.95),
  perObserverMedianMs: percentile(samples, 0.5) / observers.length,
  verification,
  disclosures: Object.fromEntries(final.map(view => [view.observer.observerId, {
    shown: view.manifest.shownNodeIds.length,
    redacted: view.manifest.redactedNodeIds.length,
    hidden: view.manifest.hiddenNodeIds.length,
  }])),
  memory: process.memoryUsage(),
  node: process.version,
  platform: process.platform,
};
mkdirSync('outputs', { recursive: true });
writeFileSync('outputs/benchmark-observer-alpha6.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
runtime.dispose();
