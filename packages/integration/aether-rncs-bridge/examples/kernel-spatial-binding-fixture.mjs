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

export function createCompoundKernel() {
  const value = new EntityKernel({ worldId: 'world:kernel-compound-binding', generation: 5, generationRoot: '2'.repeat(64), tick: 3 });
  value.registerFragment({
    fragmentId: 'spatial.body',
    fields: {
      kind: { type: 'string' },
      position: { type: 'json' },
      mass_q: { type: 'integer', default: 1000000 },
      tags: { type: 'json', default: [] },
    },
  });
  value.registerFragment({
    fragmentId: 'spatial.fixtures',
    fields: { items: { type: 'json' } },
  });
  value.registerEntity({
    entityId: 'body:compound',
    tags: ['compound'],
    fragments: {
      'spatial.body': { kind: 'dynamic', position: vector(0, 1_500, 0), mass_q: 2_000_000, tags: ['compound'] },
      'spatial.fixtures': {
        items: [
          { fixture_id: 'compound:solid', shape: { type: 'box', halfExtents: vector(600, 400, 500) }, local_position: vector(0, 0, 0), sensor: false, category_bits: 1, mask_bits: 0xffff_ffff, tags: ['solid'] },
          { fixture_id: 'compound:sensor', shape: { type: 'sphere', radius: 900 }, local_position: vector(0, 1_000, 0), sensor: true, category_bits: 2, mask_bits: 1, tags: ['sensor'] },
        ],
      },
    },
  });
  return value;
}
