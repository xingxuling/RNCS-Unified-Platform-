import { createWorldBodyIR, quaternionFromEulerMilliDegrees, semanticHash } from '../src/index.mjs';

const sourceRealityRoot = semanticHash({ worldId: 'world:body-ir-demo', source: 'rsr-authoritative-snapshot', tick: 12 });

export const minimalWorldBodyInput = {
  worldId: 'world:body-ir-demo',
  generation: 3,
  revision: 12,
  authorityState: {
    worldId: 'world:body-ir-demo',
    generation: 3,
    revision: 12,
    authorityClass: 'authoritative-snapshot',
    authorityOwner: 'rncs.rsr',
    sourceRealityRoot,
    capabilityScopes: ['world.body.read', 'world.body.project'],
  },
  physicalBodyState: {
    bodies: [{
      id: 'body:hero',
      entityId: 'entity:hero',
      kind: 'dynamic',
      transform: {
        positionMm: { x: 0, y: 1500, z: 0 },
        rotation: quaternionFromEulerMilliDegrees({ x: 0, y: 45_000, z: 0 }),
      },
      linearVelocityMmPerSecond: { x: 1000, y: 0, z: 0 },
      angularVelocityMilliDegPerSecond: { x: 0, y: 0, z: 0 },
      massGrams: 80_000,
      fixtures: [{
        id: 'fixture:hero',
        shape: { type: 'capsule', radiusMm: 350, halfHeightMm: 650 },
        localPositionMm: { x: 0, y: 0, z: 0 },
        bodyZone: 'zone:hero',
        collisionFilter: { categoryBits: 1, maskBits: 65535 },
        sensor: false,
      }],
      tags: ['player'],
    }, {
      id: 'body:floor',
      entityId: 'entity:floor',
      kind: 'static',
      transform: {
        positionMm: { x: 0, y: -250, z: 0 },
        rotation: quaternionFromEulerMilliDegrees({ x: 0, y: 0, z: 0 }),
      },
      massGrams: 0,
      fixtures: [{
        id: 'fixture:floor',
        shape: { type: 'box', halfExtentsMm: { x: 10_000, y: 250, z: 10_000 } },
        bodyZone: 'zone:floor',
        collisionFilter: { categoryBits: 2, maskBits: 65535 },
        sensor: false,
      }],
      tags: ['ground'],
    }],
  },
  assetState: {
    assets: [{
      id: 'asset:hero-mesh',
      kind: 'mesh',
      version: '1.0.0',
      contentRoot: semanticHash({ asset: 'hero-mesh', version: 1 }),
      residency: 'resident',
    }, {
      id: 'asset:floor-mesh',
      kind: 'mesh',
      version: '1.0.0',
      contentRoot: semanticHash({ asset: 'floor-mesh', version: 1 }),
      residency: 'resident',
    }],
  },
  visualBodyState: {
    bodies: [{
      id: 'visual:hero',
      entityId: 'entity:hero',
      rootNodeId: 'node:hero',
      nodes: [{
        id: 'node:hero',
        parentId: null,
        assetRef: 'asset:hero-mesh',
        castShadow: true,
        receiveShadow: true,
        tags: ['player-visual'],
      }],
    }, {
      id: 'visual:floor',
      entityId: 'entity:floor',
      rootNodeId: 'node:floor',
      nodes: [{
        id: 'node:floor',
        parentId: null,
        assetRef: 'asset:floor-mesh',
        castShadow: false,
        receiveShadow: true,
        tags: ['ground-visual'],
      }],
    }],
  },
  temporalPresentationState: {
    clock: { tick: 12, tickHz: 60 },
    policies: [{
      id: 'temporal:hero',
      mode: 'interpolate',
      interpolationDelayTicks: 1,
      maximumExtrapolationTicks: 2,
      authorityRootBinding: 'required',
      snapDistanceMm: 2500,
      blendTicks: 4,
    }],
  },
  observerState: {
    observers: [{
      id: 'observer:player',
      capabilities: ['world.observe', 'world.presentation.read'],
      qualityTier: 'balanced',
      visibleTags: ['player-visual'],
    }],
  },
  worldEventState: {
    events: [{
      id: 'event:hero-contact:12:0',
      source: 'rsr',
      kind: 'contact-begin',
      tick: 12,
      sequence: 0,
      sourceAuthorityRoot: sourceRealityRoot,
      exactlyOnceKey: `${sourceRealityRoot}:12:0`,
      routes: [
        { id: 'route:hero-contact-audio', consumer: 'audio', target: 'audio:hero-contact' },
        { id: 'route:hero-contact-animation', consumer: 'animation', target: 'animation:hero-land' }
      ],
    }],
  },
  bodyMaps: [{
    entityId: 'entity:hero',
    authorityMode: 'authoritative',
    physicalBodyRef: 'body:hero',
    visualBodyRef: 'visual:hero',
    temporalPolicyRef: 'temporal:hero',
    visualOnlyOffset: {
      positionMm: { x: 0, y: -50, z: 0 },
      rotation: quaternionFromEulerMilliDegrees({ x: 0, y: 0, z: 0 }),
      scale: { x: 1_000_000, y: 1_000_000, z: 1_000_000, scale: 1_000_000 },
      authorityAffecting: false,
    },
  }, {
    entityId: 'entity:floor',
    authorityMode: 'authoritative',
    physicalBodyRef: 'body:floor',
    visualBodyRef: 'visual:floor',
    temporalPolicyRef: 'temporal:hero',
    visualOnlyOffset: {
      positionMm: { x: 0, y: 0, z: 0 },
      rotation: quaternionFromEulerMilliDegrees({ x: 0, y: 0, z: 0 }),
      scale: { x: 1_000_000, y: 1_000_000, z: 1_000_000, scale: 1_000_000 },
      authorityAffecting: false,
    },
  }],
  renderGraphs: [{
    id: 'render-graph:main',
    resources: [
      { id: 'resource:depth', kind: 'attachment', format: 'depth24plus', lifetime: 'transient', imported: false, exported: false },
      { id: 'resource:swapchain', kind: 'swapchain', format: 'bgra8unorm', lifetime: 'external', imported: true, exported: true },
    ],
    passes: [
      {
        id: 'pass:depth',
        kind: 'shadow-depth',
        queue: 'graphics',
        dependsOn: [],
        reads: [],
        writes: [{ resourceId: 'resource:depth', access: 'depth-attachment' }],
      },
      {
        id: 'pass:main',
        kind: 'scene-color',
        queue: 'graphics',
        dependsOn: ['pass:depth'],
        reads: [{ resourceId: 'resource:depth', access: 'sampled' }],
        writes: [{ resourceId: 'resource:swapchain', access: 'color-attachment' }],
      },
    ],
  }],
};

export const minimalWorldBodyIR = createWorldBodyIR(minimalWorldBodyInput);
