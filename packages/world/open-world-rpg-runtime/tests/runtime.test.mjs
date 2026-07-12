import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenWorld, movePlayer, swordAttack, dodge, castIncantation, castSpell, compileIncantation, craftRunicFocus, tick, snapshot } from '../src/index.mjs';

test('creates a deterministic open world with enemies and NPC players', () => {
  const a = createOpenWorld({ seed: 'same' }); const b = createOpenWorld({ seed: 'same' });
  assert.equal(a.npcPlayers.length, 16); assert.equal(a.enemies.length, 14); assert.deepEqual(a.npcPlayers, b.npcPlayers);
});

test('movement is third-person-world compatible and bounded', () => {
  const s = createOpenWorld(); movePlayer(s, { x: 1, z: 1, sprint: true }, 1);
  assert.ok(s.player.x > 12 && s.player.z > 12); assert.ok(s.player.x <= 108 && s.player.z <= 108);
});

test('sword attack hits targets in front and consumes stamina', () => {
  const s = createOpenWorld(); const e = s.enemies[0]; e.x = s.player.x; e.z = s.player.z + 2;
  const before = e.hp; const out = swordAttack(s, { x: 0, z: 1 });
  assert.equal(out.ok, true); assert.ok(e.hp < before); assert.ok(s.player.stamina < 100);
});

test('dodge moves player and grants invulnerability', () => {
  const s = createOpenWorld(); const out = dodge(s, { x: 1, z: 0 });
  assert.equal(out.ok, true); assert.ok(s.player.x > 12); assert.ok(s.player.invulnerable > 0);
});

test('deterministic incantation compiler uses no LLM', () => {
  const out = compileIncantation('火焰，长枪，穿刺');
  assert.equal(out.ok, true); assert.equal(out.spellId, 'fire-lance'); assert.equal(out.llmCalls, 0);
});

test('voice incantation creates a projectile and records voice cast', () => {
  const s = createOpenWorld(); const out = castIncantation(s, '火焰 长枪 穿刺', { x: 0, z: 1 });
  assert.equal(out.result.ok, true); assert.equal(s.projectiles.length, 1); assert.equal(s.metrics.voiceCasts, 1);
});

test('shield and healing spells modify player state', () => {
  const s = createOpenWorld(); s.player.hp = 50;
  assert.equal(castSpell(s, 'frost-aegis').ok, true); assert.ok(s.player.shield > 0);
  assert.equal(castSpell(s, 'healing-light').ok, true); assert.ok(s.player.hp > 50);
});

test('crafting focus opens the ruins', () => {
  const s = createOpenWorld(); Object.assign(s.player.inventory, { ashwood: 2, iron: 2, runeDust: 3 });
  assert.equal(craftRunicFocus(s).ok, true); assert.equal(s.world.ruinsOpen, true); assert.equal(s.player.focusCrafted, true);
});

test('enemy AI damages the player in melee range', () => {
  const s = createOpenWorld(); const e = s.enemies[0]; e.x = s.player.x; e.z = s.player.z + 0.5; const hp = s.player.hp;
  tick(s, 0.1); assert.ok(s.player.hp < hp);
});

test('projectile can defeat an enemy and advance persistent metrics', () => {
  const s = createOpenWorld(); const e = s.enemies[0]; e.x = s.player.x; e.z = s.player.z + 2; e.hp = 10;
  castSpell(s, 'fire-lance', { x: 0, z: 1 }); for (let i = 0; i < 20; i++) tick(s, 0.05);
  assert.equal(e.alive, false); assert.ok(s.metrics.kills >= 1);
});

test('boss defeat opens the next version gate', () => {
  const s = createOpenWorld(); const boss = s.enemies.find(e => e.boss); boss.x = s.player.x; boss.z = s.player.z + 2; boss.hp = 1;
  swordAttack(s, { x: 0, z: 1 }); assert.equal(s.world.nextRegionOpen, true); assert.equal(s.quest.bossDefeated, true);
});

test('snapshot is isolated from the live world', () => {
  const s = createOpenWorld(); const snap = snapshot(s); snap.player.hp = 1; assert.notEqual(s.player.hp, snap.player.hp);
});

test('three-step sword combo advances inside the combo window', () => {
  const s = createOpenWorld();
  const e = s.enemies[0]; e.x = s.player.x; e.z = s.player.z + 2; e.hp = 500;
  const first = swordAttack(s, { x: 0, z: 1 });
  tick(s, 0.1); tick(s, 0.1); tick(s, 0.1); tick(s, 0.05);
  const second = swordAttack(s, { x: 0, z: 1 });
  tick(s, 0.1); tick(s, 0.1); tick(s, 0.1); tick(s, 0.1);
  const third = swordAttack(s, { x: 0, z: 1 });
  assert.equal(first.comboStep, 1);
  assert.equal(second.comboStep, 2);
  assert.equal(third.comboStep, 3);
  assert.ok(third.damage > first.damage);
});

test('world clock advances without changing deterministic LLM boundary', () => {
  const s = createOpenWorld(); const before = s.world.timeOfDay;
  for (let i = 0; i < 10; i++) tick(s, 0.1);
  assert.ok(s.world.timeOfDay > before);
  assert.equal(s.metrics.llmCalls, 0);
});
