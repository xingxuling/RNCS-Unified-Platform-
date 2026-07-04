import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenWorld, movePlayer, castIncantation, swordAttack, tick } from '../packages/world/open-world-rpg-runtime/src/index.mjs';

test('v0.18 third-person vertical slice exposes a persistent MMO-like solo world', () => {
  const world = createOpenWorld({ seed: 'v018-acceptance', name: '杜衡界' });
  assert.equal(world.npcPlayers.length, 16);
  assert.equal(world.enemies.length, 14);
  assert.equal(world.metrics.llmCalls, 0);
  const before = { x: world.player.x, z: world.player.z };
  movePlayer(world, { x: 1, z: 0, sprint: true }, 0.5);
  assert.notDeepEqual({ x: world.player.x, z: world.player.z }, before);
});

test('v0.18 action and voice-magic loop changes the same authoritative world', () => {
  const world = createOpenWorld({ seed: 'v018-combat' });
  const target = world.enemies[0]; target.x = world.player.x; target.z = world.player.z + 2; target.hp = 20;
  const sword = swordAttack(world, { x: 0, z: 1 });
  assert.equal(sword.ok, true);
  assert.equal(target.alive, false);
  const spell = castIncantation(world, '火焰 长枪 穿刺', { x: 0, z: 1 });
  assert.equal(spell.ok, true);
  assert.equal(spell.result.ok, true);
  assert.equal(world.metrics.voiceCasts, 1);
  tick(world, 0.05);
});
