export const OPEN_WORLD_RPG_VERSION = '0.2.0-alpha.1';
export const OPEN_WORLD_RPG_PROTOCOL = 'rncs.open-world-rpg.v0.2';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const clone = value => JSON.parse(JSON.stringify(value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const norm = (x, z) => { const d = Math.hypot(x, z) || 1; return { x: x / d, z: z / d }; };
const hash = text => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rngFrom = seed => { let x = hash(String(seed)) || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; };

export const SPELLS = {
  'fire-lance': { name: '火焰长枪', incantation: '火焰 长枪 穿刺', mana: 18, damage: 44, cooldown: 1.3, range: 24, kind: 'projectile', color: [1.0, 0.25, 0.08] },
  'frost-aegis': { name: '寒霜护壁', incantation: '寒霜 护盾 环绕', mana: 22, shield: 58, cooldown: 6, kind: 'shield', color: [0.25, 0.8, 1.0] },
  'thunder-chain': { name: '雷霆锁链', incantation: '雷霆 锁链 追踪', mana: 27, damage: 34, cooldown: 3.8, range: 18, kind: 'chain', color: [0.65, 0.35, 1.0] },
  'wind-step': { name: '风行步', incantation: '疾风 步伐 前行', mana: 14, cooldown: 2.5, distance: 8, kind: 'dash', color: [0.25, 1.0, 0.65] },
  'healing-light': { name: '治愈之光', incantation: '辉光 生命 复苏', mana: 25, heal: 48, cooldown: 7, kind: 'heal', color: [1.0, 0.9, 0.35] },
  'ember-nova': { name: '余烬新星', incantation: '余烬 星环 爆裂', mana: 38, damage: 65, cooldown: 9, range: 7, kind: 'nova', color: [1.0, 0.48, 0.05] }
};

export const ENEMY_ARCHETYPES = {
  imp: { name: '灰烬小鬼', hp: 70, damage: 9, speed: 3.2, aggro: 18, range: 1.8, xp: 18 },
  wolf: { name: '苔原猎狼', hp: 105, damage: 13, speed: 4.4, aggro: 22, range: 2.1, xp: 28 },
  sentinel: { name: '遗迹哨兵', hp: 165, damage: 18, speed: 2.6, aggro: 20, range: 2.4, xp: 48 },
  warden: { name: '熔心守卫', hp: 980, damage: 28, speed: 2.8, aggro: 40, range: 3.5, xp: 500, boss: true }
};

const INCANTATION_RULES = [
  ['fire-lance', [['火焰','烈火','fire'], ['长枪','枪','lance','穿刺']]],
  ['frost-aegis', [['寒霜','冰霜','frost','ice'], ['护盾','护壁','盾','shield']]],
  ['thunder-chain', [['雷霆','闪电','thunder','lightning'], ['锁链','链','chain','追踪']]],
  ['wind-step', [['疾风','风','wind'], ['步伐','前行','step','dash']]],
  ['healing-light', [['辉光','治愈','生命','healing','light'], ['复苏','恢复','heal','life']]],
  ['ember-nova', [['余烬','ember'], ['星环','新星','nova'], ['爆裂','burst']]]
];

export function normalizeIncantation(text = '') {
  return String(text).toLowerCase().replace(/[，。！？、·,.!?\s:_-]/g, '');
}

export function compileIncantation(text = '') {
  const normalized = normalizeIncantation(text);
  for (const [spellId, groups] of INCANTATION_RULES) {
    const ok = groups.every(group => group.some(token => normalized.includes(normalizeIncantation(token))));
    if (ok) return { ok: true, spellId, spell: SPELLS[spellId], confidence: 0.96, engine: 'deterministic-token-grammar', llmCalls: 0 };
  }
  for (const [spellId, spell] of Object.entries(SPELLS)) {
    if (normalized === normalizeIncantation(spell.name) || normalized === normalizeIncantation(spell.incantation)) {
      return { ok: true, spellId, spell, confidence: 1, engine: 'deterministic-token-grammar', llmCalls: 0 };
    }
  }
  return { ok: false, confidence: 0, reason: 'INCANTATION_NOT_RECOGNIZED', engine: 'deterministic-token-grammar', llmCalls: 0 };
}

function makeEnemy(type, id, x, z) {
  const a = ENEMY_ARCHETYPES[type];
  return { id, type, name: a.name, x, z, spawnX: x, spawnZ: z, hp: a.hp, maxHp: a.hp, damage: a.damage, speed: a.speed, aggro: a.aggro, attackRange: a.range, xp: a.xp, boss: !!a.boss, alive: true, phase: 1, attackCooldown: 0, burn: 0, slow: 0 };
}

function makeNpcPlayers(rng) {
  const names = ['夜雨','白鸦','铸星者','风铃旅者','霜枝','赤砂','星轨','无声剑','青穹','旧梦','炉心','月湾','影鹿','渡火','银槲','静雷'];
  const guilds = ['灰烬远征团','星纹学院','白鸦商会','无名旅团'];
  return names.map((name, index) => ({
    id: `npc-player:${String(index + 1).padStart(3, '0')}`,
    name,
    guild: guilds[index % guilds.length],
    level: 2 + Math.floor(rng() * 12),
    role: ['剑士','法师','游侠','神官'][index % 4],
    x: 8 + rng() * 86,
    z: 8 + rng() * 86,
    targetX: 8 + rng() * 86,
    targetZ: 8 + rng() * 86,
    activity: ['练级','采集','返回主城','寻找队伍','探索遗迹'][index % 5],
    speed: 1.4 + rng() * 1.3
  }));
}

export function createOpenWorld(options = {}) {
  const seed = String(options.seed || 'ashen-frontier-3d-season0');
  const rng = rngFrom(seed);
  const enemies = [];
  let n = 1;
  for (const p of [[32,24],[38,20],[43,29],[48,18],[51,34],[57,27]]) enemies.push(makeEnemy('imp', `imp:${n++}`, p[0], p[1]));
  n = 1;
  for (const p of [[58,49],[65,44],[69,56],[75,46]]) enemies.push(makeEnemy('wolf', `wolf:${n++}`, p[0], p[1]));
  n = 1;
  for (const p of [[82,67],[87,74],[91,63]]) enemies.push(makeEnemy('sentinel', `sentinel:${n++}`, p[0], p[1]));
  enemies.push(makeEnemy('warden', 'warden:001', 96, 88));
  const state = {
    format: 'rncs.open-world-rpg-state.v0.1',
    version: OPEN_WORLD_RPG_VERSION,
    protocol: OPEN_WORLD_RPG_PROTOCOL,
    seed,
    time: 0,
    day: 1,
    player: {
      name: options.name || '无名咏唱者', x: 20, z: 19, yaw: 0, level: 1, xp: 0, xpNext: 100,
      hp: 140, maxHp: 140, mana: 100, maxMana: 100, stamina: 100, maxStamina: 100,
      shield: 0, gold: 40, attackCooldown: 0, comboWindow: 0, comboStep: 0, dodgeCooldown: 0, invulnerable: 0,
      knownSpells: ['fire-lance','frost-aegis','wind-step','healing-light'], cooldowns: {},
      inventory: { potion: 3, ashwood: 0, iron: 0, runeDust: 0 }, focusCrafted: false
    },
    enemies,
    npcPlayers: makeNpcPlayers(rng),
    projectiles: [], effects: [], announcements: [], history: [],
    quest: { stage: 'meet-lyra', impKills: 0, bossDefeated: false },
    world: { ruinsOpen: false, season: 'Season 0', region: '灰烬边境', nextRegion: '浮空学院', nextRegionOpen: false, timeOfDay: 0.18 },
    metrics: { swordSwings: 0, spellCasts: 0, voiceCasts: 0, kills: 0, llmCalls: 0 }
  };
  announce(state, '【世界公告】灰烬边境 Season 0 已开启。');
  return state;
}

export function announce(state, message) {
  state.announcements.unshift({ time: state.time, message });
  state.announcements = state.announcements.slice(0, 8);
  state.history.push({ time: state.time, code: 'ANNOUNCEMENT', message });
}

export function movePlayer(state, input, dt) {
  const p = state.player;
  const v = norm(input.x || 0, input.z || 0);
  const magnitude = Math.min(1, Math.hypot(input.x || 0, input.z || 0));
  const speed = input.sprint && p.stamina > 0 ? 8.5 : 5.5;
  p.x = clamp(p.x + v.x * speed * magnitude * dt, 2, 108);
  p.z = clamp(p.z + v.z * speed * magnitude * dt, 2, 108);
  if (magnitude > 0.1) p.yaw = Math.atan2(v.x, v.z);
  if (input.sprint && magnitude > 0.1) p.stamina = clamp(p.stamina - 14 * dt, 0, p.maxStamina);
  else p.stamina = clamp(p.stamina + 19 * dt, 0, p.maxStamina);
  return state;
}

function hurtEnemy(state, enemy, amount, source = 'unknown') {
  if (!enemy || !enemy.alive) return false;
  enemy.hp -= amount;
  if (enemy.hp <= 0) {
    enemy.hp = 0; enemy.alive = false; state.metrics.kills += 1;
    state.player.xp += enemy.xp; state.player.gold += enemy.boss ? 140 : 5;
    if (enemy.type === 'imp') { state.quest.impKills += 1; state.player.inventory.runeDust += 1; }
    if (enemy.type === 'sentinel') state.player.inventory.iron += 1;
    if (enemy.type === 'wolf') state.player.inventory.ashwood += 1;
    if (enemy.boss) {
      state.quest.bossDefeated = true; state.world.nextRegionOpen = true;
      if (!state.player.knownSpells.includes('ember-nova')) state.player.knownSpells.push('ember-nova');
      announce(state, `【首杀公告】${state.player.name}击败了区域首领“熔心守卫”。`);
    }
    state.history.push({ time: state.time, code: 'ENEMY_DEFEATED', enemy: enemy.name, source });
    while (state.player.xp >= state.player.xpNext) {
      state.player.xp -= state.player.xpNext; state.player.level += 1; state.player.xpNext = Math.round(state.player.xpNext * 1.35);
      state.player.maxHp += 16; state.player.hp = state.player.maxHp; state.player.maxMana += 10; state.player.mana = state.player.maxMana;
      announce(state, `【成长公告】${state.player.name}达到等级 ${state.player.level}。`);
    }
    return true;
  }
  return false;
}

export function swordAttack(state, facing = { x: 0, z: 1 }) {
  const p = state.player;
  if (p.attackCooldown > 0 || p.stamina < 10) return { ok: false, reason: 'NOT_READY' };
  p.comboStep = p.comboWindow > 0 ? (p.comboStep % 3) + 1 : 1;
  p.comboWindow = 0.74;
  const cooldowns = [0, 0.34, 0.38, 0.54];
  const staminaCosts = [0, 10, 12, 18];
  const damageScales = [0, 1, 1.18, 1.62];
  p.attackCooldown = cooldowns[p.comboStep];
  p.stamina -= staminaCosts[p.comboStep];
  state.metrics.swordSwings += 1;
  const dir = norm(facing.x, facing.z);
  const range = 3.1 + p.comboStep * 0.15;
  const hits = state.enemies.filter(e => e.alive && distance(p, e) <= range).filter(e => {
    const to = norm(e.x - p.x, e.z - p.z); return to.x * dir.x + to.z * dir.z > 0.2;
  });
  const damage = (30 + p.level * 4) * damageScales[p.comboStep];
  for (const enemy of hits) hurtEnemy(state, enemy, damage, `sword-combo-${p.comboStep}`);
  return { ok: true, comboStep: p.comboStep, damage, hits: hits.map(e => e.id) };
}

export function dodge(state, facing = { x: 0, z: 1 }) {
  const p = state.player;
  if (p.dodgeCooldown > 0 || p.stamina < 24) return { ok: false, reason: 'NOT_READY' };
  const dir = norm(facing.x, facing.z);
  p.x = clamp(p.x + dir.x * 5.5, 2, 108); p.z = clamp(p.z + dir.z * 5.5, 2, 108);
  p.stamina -= 24; p.dodgeCooldown = 0.85; p.invulnerable = 0.45;
  return { ok: true };
}

export function castSpell(state, spellId, direction = { x: 0, z: 1 }, viaVoice = false) {
  const p = state.player; const spell = SPELLS[spellId];
  if (!spell) return { ok: false, reason: 'UNKNOWN_SPELL' };
  if (!p.knownSpells.includes(spellId)) return { ok: false, reason: 'SPELL_NOT_KNOWN' };
  if ((p.cooldowns[spellId] || 0) > 0) return { ok: false, reason: 'COOLDOWN' };
  if (p.mana < spell.mana) return { ok: false, reason: 'NO_MANA' };
  p.mana -= spell.mana; p.cooldowns[spellId] = spell.cooldown; state.metrics.spellCasts += 1; if (viaVoice) state.metrics.voiceCasts += 1;
  const dir = norm(direction.x, direction.z);
  if (spell.kind === 'projectile') state.projectiles.push({ id: `projectile:${state.time}:${state.projectiles.length}`, spellId, x: p.x, z: p.z, vx: dir.x * 18, vz: dir.z * 18, ttl: 1.7, damage: spell.damage, color: spell.color });
  if (spell.kind === 'shield') p.shield = Math.max(p.shield, spell.shield);
  if (spell.kind === 'dash') { p.x = clamp(p.x + dir.x * spell.distance, 2, 108); p.z = clamp(p.z + dir.z * spell.distance, 2, 108); p.invulnerable = 0.35; }
  if (spell.kind === 'heal') p.hp = clamp(p.hp + spell.heal, 0, p.maxHp);
  if (spell.kind === 'nova') for (const e of state.enemies.filter(e => e.alive && distance(p, e) <= spell.range)) hurtEnemy(state, e, spell.damage, spellId);
  if (spell.kind === 'chain') {
    const targets = state.enemies.filter(e => e.alive && distance(p, e) <= spell.range).sort((a,b) => distance(p,a)-distance(p,b)).slice(0,3);
    for (const e of targets) hurtEnemy(state, e, spell.damage, spellId);
  }
  state.effects.push({ kind: spell.kind, spellId, x: p.x, z: p.z, ttl: 0.9, color: spell.color });
  state.history.push({ time: state.time, code: 'SPELL_CAST', spellId, viaVoice });
  return { ok: true, spellId };
}

export function castIncantation(state, text, direction = { x: 0, z: 1 }) {
  const compiled = compileIncantation(text);
  if (!compiled.ok) return compiled;
  return { ...compiled, result: castSpell(state, compiled.spellId, direction, true) };
}

export function craftRunicFocus(state) {
  const inv = state.player.inventory;
  if (inv.ashwood < 2 || inv.iron < 2 || inv.runeDust < 3) return { ok: false, reason: 'MATERIALS_REQUIRED' };
  inv.ashwood -= 2; inv.iron -= 2; inv.runeDust -= 3; state.player.focusCrafted = true; state.world.ruinsOpen = true;
  announce(state, `【制造公告】${state.player.name}完成了初阶魔导器，封锁遗迹已解禁。`);
  return { ok: true };
}

function tickNpcPlayers(state, dt) {
  for (const n of state.npcPlayers) {
    const d = distance(n, { x: n.targetX, z: n.targetZ });
    if (d < 1.2) {
      const r = rngFrom(`${state.seed}:${n.id}:${Math.floor(state.time / 8)}`);
      n.targetX = 6 + r() * 96; n.targetZ = 6 + r() * 96;
      n.activity = ['练级','采集','返回主城','寻找队伍','探索遗迹'][Math.floor(r() * 5)];
    } else {
      const v = norm(n.targetX - n.x, n.targetZ - n.z); n.x += v.x * n.speed * dt; n.z += v.z * n.speed * dt;
    }
  }
}

function tickEnemies(state, dt) {
  const p = state.player;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.attackCooldown = Math.max(0, e.attackCooldown - dt);
    if (e.burn > 0) { e.burn -= dt; hurtEnemy(state, e, 4 * dt, 'burn'); }
    if (e.boss) e.phase = e.hp < e.maxHp * 0.33 ? 3 : e.hp < e.maxHp * 0.66 ? 2 : 1;
    const d = distance(e, p);
    if (d < e.aggro && d > e.attackRange) {
      const v = norm(p.x - e.x, p.z - e.z); const slowFactor = e.slow > 0 ? 0.55 : 1;
      e.x += v.x * e.speed * slowFactor * dt; e.z += v.z * e.speed * slowFactor * dt;
    } else if (d <= e.attackRange && e.attackCooldown <= 0) {
      e.attackCooldown = e.boss ? Math.max(0.8, 1.8 - e.phase * 0.22) : 1.6;
      if (p.invulnerable <= 0) {
        let damage = e.damage * (e.boss ? 0.75 + e.phase * 0.2 : 1);
        const blocked = Math.min(p.shield, damage); p.shield -= blocked; damage -= blocked; p.hp = clamp(p.hp - damage, 0, p.maxHp);
      }
    }
  }
}

function tickProjectiles(state, dt) {
  for (const p of state.projectiles) {
    p.x += p.vx * dt; p.z += p.vz * dt; p.ttl -= dt;
    const hit = state.enemies.find(e => e.alive && distance(p, e) < (e.boss ? 2.4 : 1.4));
    if (hit) { hurtEnemy(state, hit, p.damage, p.spellId); hit.burn = 3; p.ttl = 0; }
  }
  state.projectiles = state.projectiles.filter(p => p.ttl > 0);
  for (const e of state.effects) e.ttl -= dt;
  state.effects = state.effects.filter(e => e.ttl > 0);
}

export function tick(state, dt) {
  dt = clamp(Number(dt) || 0, 0, 0.1); state.time += dt;
  const p = state.player;
  p.attackCooldown = Math.max(0, p.attackCooldown - dt); p.comboWindow = Math.max(0, p.comboWindow - dt); if (p.comboWindow <= 0) p.comboStep = 0; p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt); p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.mana = clamp(p.mana + 5 * dt, 0, p.maxMana); p.stamina = clamp(p.stamina + 11 * dt, 0, p.maxStamina);
  for (const id of Object.keys(p.cooldowns)) p.cooldowns[id] = Math.max(0, p.cooldowns[id] - dt);
  state.world.timeOfDay = (state.world.timeOfDay + dt / 600) % 1; tickNpcPlayers(state, dt); tickEnemies(state, dt); tickProjectiles(state, dt);
  if (p.hp <= 0) { p.hp = p.maxHp; p.mana = p.maxMana; p.x = 20; p.z = 19; announce(state, `【复苏】${p.name}在边境城镇重新苏醒。`); }
  return state;
}

export function snapshot(state) { return clone(state); }
