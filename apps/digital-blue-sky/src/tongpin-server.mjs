#!/usr/bin/env node
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PORT = Number(process.env.PORT || process.env.TONGPIN_PORT || 17821);
const HOST = process.env.HOST || process.env.TONGPIN_HOST || '127.0.0.1';
const DATA_FILE = process.env.TONGPIN_DATA_FILE || path.resolve(process.cwd(), 'data', 'tongpin-worlds.json');
const ROOM_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PLAYER_ONLINE_MS = 15_000;
const PRODUCTION_INTERVAL_MS = Math.max(1000, Number(process.env.TONGPIN_PRODUCTION_INTERVAL_MS || 60_000));
const rooms = new Map();

const ITEM_COSTS = {
  flower: { windSeeds: 1, starCrystals: 0, wood: 0 },
  lantern: { windSeeds: 1, starCrystals: 1, wood: 0 },
  bench: { windSeeds: 0, starCrystals: 0, wood: 2 },
};
const NURSERY_COST = { windSeeds: 2, starCrystals: 2, wood: 2 };
const CHARM_COST = { windSeeds: 1, starCrystals: 1, wood: 0 };

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Cache-Control', 'no-store');
}

function sendJson(response, status, payload) {
  setCors(response);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 64 * 1024) throw new Error('请求内容过大');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('请求格式不正确'); }
}

function id(prefix) { return `${prefix}_${randomBytes(9).toString('hex')}`; }
function roomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let code = '';
    for (const byte of randomBytes(6)) code += alphabet[byte % alphabet.length];
    if (!rooms.has(code)) return code;
  }
  throw new Error('暂时无法开始，请重试');
}
function publicBaseUrl(request) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const host = String(request.headers.host || `127.0.0.1:${PORT}`).split(',')[0].trim();
  return `http://${host}`;
}
function player(name, role) {
  const playerId = id('player');
  const token = id('token');
  return { token, value: { id: playerId, name: String(name || (role === 'wind' ? '风行者' : '星构师')).trim().slice(0, 16), role, x: role === 'wind' ? 160 : 640, y: 460, lastSeen: Date.now() } };
}
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(value) { return Math.max(0, Math.min(99, Math.floor(Number(value) || 0))); }
function add(room, values) { for (const [key, value] of Object.entries(values)) room.resources[key] = clamp(room.resources[key] + value); }
function canAfford(resources, cost) { return Object.entries(cost).every(([key, value]) => resources[key] >= value); }
function spend(room, cost) { if (!canAfford(room.resources, cost)) return false; for (const [key, value] of Object.entries(cost)) room.resources[key] -= value; return true; }
function level(room) { room.homeLevel = room.homeXp >= 12 ? 3 : room.homeXp >= 5 ? 2 : 1; }
function xp(room, amount) { room.homeXp = Math.max(0, room.homeXp + amount); level(room); }
function touch(room) { room.revision += 1; room.updatedAt = Date.now(); }
function groveNodes() { return [
  { id: 'wind-1', kind: 'wind-seed', x: 150, y: 350, collected: false },
  { id: 'wind-2', kind: 'wind-seed', x: 220, y: 220, collected: false },
  { id: 'wind-3', kind: 'wind-seed', x: 160, y: 110, collected: false },
  { id: 'star-1', kind: 'star-crystal', x: 650, y: 350, collected: false },
  { id: 'star-2', kind: 'star-crystal', x: 580, y: 220, collected: false },
  { id: 'star-3', kind: 'star-crystal', x: 640, y: 110, collected: false },
  { id: 'wood-1', kind: 'wood', x: 320, y: 340, collected: false },
  { id: 'wood-2', kind: 'wood', x: 400, y: 260, collected: false },
  { id: 'wood-3', kind: 'wood', x: 480, y: 340, collected: false },
]; }
function creature(room) { const maxHp = 6 + Math.min(6, room.raidCompletions * 2); return { hp: maxHp, maxHp, mist: 0, lastRole: null, defeated: false }; }
function status(room) { if (room.scene === 'challenge') return room.players.size < 2 ? 'waiting' : 'playing'; if (room.scene === 'grove') return 'exploring'; if (room.scene === 'ruins') return 'fighting'; return 'home'; }
function applyProduction(room) {
  if (!room.nurseryBuilt) return false;
  const now = Date.now();
  const cycles = Math.min(20, Math.floor((now - room.lastProductionAt) / PRODUCTION_INTERVAL_MS));
  if (cycles <= 0) return false;
  add(room, { windSeeds: cycles, starCrystals: cycles, wood: Math.floor(cycles / 2) });
  room.lastProductionAt += cycles * PRODUCTION_INTERVAL_MS;
  return true;
}
function serialize(room) {
  const now = Date.now();
  return {
    code: room.code, revision: room.revision, createdAt: room.createdAt, updatedAt: room.updatedAt,
    scene: room.scene, gateOpen: room.gateOpen, coreActive: room.coreActive,
    groveExitOpen: room.groveNodes.length > 0 && room.groveNodes.every((node) => node.collected),
    ruinsExitOpen: Boolean(room.creature?.defeated), homeLevel: room.homeLevel, homeXp: room.homeXp,
    charms: room.charms, raidCompletions: room.raidCompletions, resources: { ...room.resources },
    automation: { nurseryBuilt: room.nurseryBuilt, lastProductionAt: room.lastProductionAt, nextProductionAt: room.nurseryBuilt ? room.lastProductionAt + PRODUCTION_INTERVAL_MS : null },
    homeItems: room.homeItems.map((item) => ({ ...item })), groveNodes: room.groveNodes.map((node) => ({ ...node })), creature: room.creature ? { ...room.creature } : null,
    status: status(room), players: [...room.players.values()].map((value) => ({ ...value, connected: now - value.lastSeen <= PLAYER_ONLINE_MS })),
  };
}
function disk(room) { return { ...serialize(room), nurseryBuilt: room.nurseryBuilt, lastProductionAt: room.lastProductionAt, players: [...room.players.values()], tokens: [...room.tokens.entries()] }; }
function fromDisk(value) {
  const now = Date.now();
  const room = {
    code: String(value.code || '').toUpperCase(), revision: Math.max(1, Number(value.revision) || 1), createdAt: Number(value.createdAt) || now, updatedAt: Number(value.updatedAt) || now,
    scene: ['challenge', 'home', 'grove', 'ruins'].includes(value.scene) ? value.scene : 'home', gateOpen: Boolean(value.gateOpen), coreActive: Boolean(value.coreActive),
    homeLevel: Math.max(1, Number(value.homeLevel) || 1), homeXp: Math.max(0, Number(value.homeXp) || 0), charms: Math.max(0, Number(value.charms) || 0), raidCompletions: Math.max(0, Number(value.raidCompletions) || 0),
    resources: { windSeeds: clamp(value.resources?.windSeeds), starCrystals: clamp(value.resources?.starCrystals), wood: clamp(value.resources?.wood) }, nurseryBuilt: Boolean(value.nurseryBuilt ?? value.automation?.nurseryBuilt), lastProductionAt: Number(value.lastProductionAt ?? value.automation?.lastProductionAt) || now,
    homeItems: Array.isArray(value.homeItems) ? value.homeItems.slice(0, 24) : [], groveNodes: Array.isArray(value.groveNodes) ? value.groveNodes : [], creature: value.creature ? { ...value.creature } : null,
    players: new Map(), tokens: new Map(Array.isArray(value.tokens) ? value.tokens : []),
  };
  for (const item of Array.isArray(value.players) ? value.players : []) if (item?.id) room.players.set(item.id, { ...item, lastSeen: Number(item.lastSeen) || 0 });
  level(room); return room;
}

let saveQueue = Promise.resolve();
let saveTimer = null;
function persist() {
  saveQueue = saveQueue.then(async () => {
    await mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify({ version: 2, savedAt: Date.now(), rooms: [...rooms.values()].map(disk) }), 'utf8');
    await rename(tmp, DATA_FILE);
  });
  return saveQueue;
}
function schedulePersist() { if (saveTimer) return; saveTimer = setTimeout(() => { saveTimer = null; void persist(); }, 300); saveTimer.unref?.(); }
async function load() {
  try {
    const value = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    const cutoff = Date.now() - ROOM_TTL_MS;
    for (const item of Array.isArray(value.rooms) ? value.rooms : []) { const room = fromDisk(item); if (room.code && room.updatedAt >= cutoff) rooms.set(room.code, room); }
  } catch (error) { if (error?.code !== 'ENOENT') console.error('[Tongpin] load failed', error); }
}
function findPlayer(room, token) { const playerId = room.tokens.get(String(token || '')); return playerId ? room.players.get(playerId) : null; }
function resetPositions(room, scene) { [...room.players.values()].forEach((value, index) => { value.x = index === 0 ? 260 : 540; value.y = scene === 'home' ? 410 : 450; }); }
function move(room, value, dxValue, dyValue) {
  let dx = Math.max(-1, Math.min(1, Number(dxValue) || 0)); let dy = Math.max(-1, Math.min(1, Number(dyValue) || 0)); const magnitude = Math.hypot(dx, dy) || 1;
  let x = Math.max(24, Math.min(776, value.x + (dx / magnitude) * 15)); let y = Math.max(50, Math.min(496, value.y + (dy / magnitude) * 15));
  if (room.scene === 'challenge' && y + 17 >= 230 && y - 17 <= 256) { const inGate = x - 17 >= 350 && x + 17 <= 450; if (!inGate || !room.gateOpen) return false; }
  value.x = Math.round(x * 10) / 10; value.y = Math.round(y * 10) / 10; return true;
}
function updateGate(room) { const values = [...room.players.values()]; const wind = values.find((v) => v.role === 'wind'); const star = values.find((v) => v.role === 'star'); if (wind && star && distance(wind, { x: 160, y: 390 }) <= 38 && distance(star, { x: 640, y: 390 }) <= 38) room.gateOpen = true; }
function collect(room, value) { const node = room.groveNodes.filter((n) => !n.collected).sort((a, b) => distance(value, a) - distance(value, b))[0]; if (!node || distance(value, node) > 46) return false; if (node.kind === 'wind-seed' && value.role !== 'wind') return false; if (node.kind === 'star-crystal' && value.role !== 'star') return false; node.collected = true; if (node.kind === 'wind-seed') add(room, { windSeeds: 1 }); if (node.kind === 'star-crystal') add(room, { starCrystals: 1 }); if (node.kind === 'wood') add(room, { wood: 1 }); return true; }
function returnHome(room) { room.scene = 'home'; room.creature = null; resetPositions(room, 'home'); }
function creatureInteract(room, value) { const target = room.creature; if (!target) return false; if (target.defeated) { if (distance(value, { x: 400, y: 78 }) <= 72) { returnHome(room); return true; } return false; } if (distance(value, { x: 400, y: 250 }) > 82) return false; if (!target.lastRole) { target.lastRole = value.role; return true; } if (target.lastRole !== value.role) { target.hp = Math.max(0, target.hp - 2); target.lastRole = null; target.mist = Math.max(0, target.mist - 1); if (target.hp === 0) { target.defeated = true; room.raidCompletions += 1; room.charms = Math.min(9, room.charms + 1); add(room, { windSeeds: 2, starCrystals: 2, wood: 2 }); xp(room, 4); } return true; } target.lastRole = null; if (room.charms > 0) room.charms -= 1; else if (++target.mist >= 3) returnHome(room); return true; }

await load();
const server = http.createServer(async (request, response) => {
  setCors(response);
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  const url = new URL(request.url || '/', publicBaseUrl(request));
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  try {
    if (request.method === 'GET' && pathname === '/health') return sendJson(response, 200, { ok: true, service: 'tongpin-island', rooms: rooms.size, persistent: true });
    if (request.method === 'POST' && pathname === '/v1/tongpin/rooms') {
      const body = await readJson(request); const code = roomCode(); const now = Date.now(); const room = { code, revision: 1, createdAt: now, updatedAt: now, scene: 'challenge', gateOpen: false, coreActive: false, homeLevel: 1, homeXp: 0, charms: 0, raidCompletions: 0, resources: { windSeeds: 0, starCrystals: 0, wood: 0 }, nurseryBuilt: false, lastProductionAt: now, homeItems: [], groveNodes: [], creature: null, players: new Map(), tokens: new Map() };
      const created = player(body.name, 'wind'); room.players.set(created.value.id, created.value); room.tokens.set(created.token, created.value.id); rooms.set(code, room); await persist();
      return sendJson(response, 201, { session: { roomCode: code, playerId: created.value.id, playerToken: created.token, role: 'wind', serverUrl: publicBaseUrl(request) }, state: serialize(room) });
    }
    const join = pathname.match(/^\/v1\/tongpin\/rooms\/([A-Z0-9]{4,8})\/join$/i);
    if (request.method === 'POST' && join) { const room = rooms.get(join[1].toUpperCase()); if (!room) return sendJson(response, 404, { error: '这条邀请已经失效' }); if (room.players.size >= 2) return sendJson(response, 409, { error: '这座岛已经有两个人了' }); const body = await readJson(request); const created = player(body.name, 'star'); room.players.set(created.value.id, created.value); room.tokens.set(created.token, created.value.id); touch(room); await persist(); return sendJson(response, 200, { session: { roomCode: room.code, playerId: created.value.id, playerToken: created.token, role: 'star', serverUrl: publicBaseUrl(request) }, state: serialize(room) }); }
    const state = pathname.match(/^\/v1\/tongpin\/rooms\/([A-Z0-9]{4,8})\/state$/i);
    if (request.method === 'GET' && state) { const room = rooms.get(state[1].toUpperCase()); if (!room) return sendJson(response, 404, { error: '这座岛暂时不在了' }); const value = findPlayer(room, url.searchParams.get('token')); if (!value) return sendJson(response, 401, { error: '这次邀请已经失效' }); value.lastSeen = Date.now(); if (applyProduction(room)) { touch(room); await persist(); } return sendJson(response, 200, serialize(room)); }
    const actionMatch = pathname.match(/^\/v1\/tongpin\/rooms\/([A-Z0-9]{4,8})\/actions$/i);
    if (request.method === 'POST' && actionMatch) { const room = rooms.get(actionMatch[1].toUpperCase()); if (!room) return sendJson(response, 404, { error: '这座岛暂时不在了' }); const body = await readJson(request); const value = findPlayer(room, body.token); if (!value) return sendJson(response, 401, { error: '这次邀请已经失效' }); const action = body.action || {}; value.lastSeen = Date.now(); let changed = applyProduction(room); let durable = changed;
      if (action.type === 'move') { changed = move(room, value, action.dx, action.dy) || changed; if (room.scene === 'challenge') updateGate(room); }
      else if (action.type === 'interact' && room.scene === 'challenge') { if (room.gateOpen && distance(value, { x: 400, y: 105 }) <= 70) { room.scene = 'home'; room.coreActive = true; xp(room, 2); resetPositions(room, 'home'); changed = durable = true; } }
      else if (action.type === 'interact' && room.scene === 'grove') { if (collect(room, value)) changed = durable = true; else if (room.groveNodes.every((n) => n.collected) && distance(value, { x: 400, y: 78 }) <= 72) { returnHome(room); changed = durable = true; } }
      else if (action.type === 'interact' && room.scene === 'ruins') { changed = creatureInteract(room, value) || changed; durable = changed; }
      else if (action.type === 'travel' && room.scene === 'home' && room.players.size === 2) { if (action.destination === 'grove') { room.scene = 'grove'; room.groveNodes = groveNodes(); room.creature = null; resetPositions(room, 'grove'); changed = durable = true; } else if (action.destination === 'ruins' && room.homeLevel >= 2) { room.scene = 'ruins'; room.creature = creature(room); resetPositions(room, 'ruins'); changed = durable = true; } }
      else if (action.type === 'place-item' && room.scene === 'home') { const cost = ITEM_COSTS[action.itemType]; if (cost && room.homeItems.length < 24 && spend(room, cost)) { room.homeItems.push({ id: id('item'), type: action.itemType, x: Math.max(70, Math.min(730, value.x + (value.role === 'wind' ? -18 : 18))), y: Math.max(145, Math.min(455, value.y - 22)), placedBy: value.id }); xp(room, 1); changed = durable = true; } }
      else if (action.type === 'build-nursery' && room.scene === 'home') { if (!room.nurseryBuilt && spend(room, NURSERY_COST)) { room.nurseryBuilt = true; room.lastProductionAt = Date.now(); xp(room, 3); changed = durable = true; } }
      else if (action.type === 'craft-charm' && room.scene === 'home') { if (spend(room, CHARM_COST)) { room.charms = Math.min(9, room.charms + 1); changed = durable = true; } }
      else if (action.type === 'heartbeat') room.updatedAt = Date.now();
      else if (!action.type) return sendJson(response, 400, { error: '缺少动作类型' });
      if (changed) { touch(room); if (durable) await persist(); else schedulePersist(); }
      return sendJson(response, 200, serialize(room));
    }
    return sendJson(response, 404, { error: '未找到请求的资源' });
  } catch (error) { console.error(error); return sendJson(response, 400, { error: error instanceof Error ? error.message : '请求处理失败' }); }
});

const cleanup = setInterval(() => { const cutoff = Date.now() - ROOM_TTL_MS; let changed = false; for (const [code, room] of rooms) if (room.updatedAt < cutoff) { rooms.delete(code); changed = true; } if (changed) schedulePersist(); }, 60_000); cleanup.unref();
async function shutdown() { clearInterval(cleanup); if (saveTimer) clearTimeout(saveTimer); try { await persist(); } catch {} server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500).unref(); }
process.once('SIGTERM', () => void shutdown()); process.once('SIGINT', () => void shutdown());
server.listen(PORT, HOST, () => { console.log(`[Tongpin Island] http://${HOST}:${PORT}`); console.log(`[Tongpin Island] data: ${DATA_FILE}`); });
