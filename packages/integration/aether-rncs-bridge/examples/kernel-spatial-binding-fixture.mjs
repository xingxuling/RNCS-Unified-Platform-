import { EntityKernel } from '@taowind/rncs-core-contract';

const ROOT = '1'.repeat(64);
const vector = (x, y, z) => ({ x, y, z });

export function createKernel() {
  const value = new EntityKernel({ worldId: 'world:kernel-binding', generation: 4, generationRoot: ROOT, tick: 12 });
  value.registerFragment({
    fragmentId: 'spatial.body',
    fields: {
      kind: { type: 'string' },
      position: { type: 'json' },
      rotation: { type: 'json', default: vector(0, 0, 0) },
      velocity: { type: 'json', default: vector(0, 0, 0) },
      tags: { type: 'json', default: [] },
      enabled: { type: 'boolean', default: true }
    }
  });
  value.registerFragment({
    fragmentId: 'spatial.fixture',
    fields: {
      shape: { type: 'json' },
      local_position: { type: 'json', default: vector(0, 0, 0) },
      sensor: { type: 'boolean', default: false },
      tags: { type: 'json', default: [] }
    }
  });
  value.registerEntity({
    entityId: 'body:ground',
    tags: ['environment'],
    fragments: {
      'spatial.body': { kind: 'static', position: vector(0, 0, 0), tags: ['ground'] },
      'spatial.fixture': { shape: { type: 'box', halfExtents: vector(8_000, 500, 8_000) }, tags: ['solid'] }
    }
  });
  value.registerEntity({
    entityId: 'body:crate',
    tags: ['prop'],
    fragments: {
      'spatial.body': { kind: 'dynamic', position: vector(0, 2_000, 0), tags: ['crate'] },
      'spatial.fixture': { shape: { type: 'box', halfExtents: vector(500, 500, 500) }, tags: ['solid'] }
    }
  });
  return value;
}
