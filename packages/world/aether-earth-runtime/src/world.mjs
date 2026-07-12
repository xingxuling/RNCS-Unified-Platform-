import { DeterministicRandom } from './prng.mjs';

export const CLIMATES = Object.freeze(['oceanic', 'temperate', 'arid', 'tundra']);
export const ACTIONS = Object.freeze(['forage', 'move', 'share', 'experiment', 'rest']);

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function tileIndex(x, y, width) {
  return y * width + x;
}

export function createEarthGrid({ width = 16, height = 16, seed = 0x0ea4f001 } = {}) {
  const random = new DeterministicRandom(seed);
  const tiles = [];
  for (let y = 0; y < height; y += 1) {
    const latitude = Math.abs((y / Math.max(1, height - 1)) * 2 - 1);
    for (let x = 0; x < width; x += 1) {
      const moistureNoise = random.next();
      const elevation = round(random.next());
      let climate;
      if (latitude > 0.78) climate = 'tundra';
      else if (moistureNoise < 0.24) climate = 'arid';
      else if (moistureNoise > 0.78) climate = 'oceanic';
      else climate = 'temperate';
      const moistureBase = climate === 'oceanic' ? 0.88 : climate === 'arid' ? 0.18 : climate === 'tundra' ? 0.42 : 0.62;
      const biomassBase = climate === 'temperate' ? 0.76 : climate === 'oceanic' ? 0.6 : climate === 'tundra' ? 0.2 : 0.24;
      tiles.push({
        id: `tile:${x}:${y}`, x, y, climate, elevation,
        moisture: round(clamp(moistureBase + (random.next() - 0.5) * 0.18)),
        biomass: round(clamp(biomassBase + (random.next() - 0.5) * 0.2)),
        mineral: round(0.25 + elevation * 0.7),
        temperature: round(30 - latitude * 45 - elevation * 6, 2),
        carryingCapacity: Math.max(1, Math.round(2 + biomassBase * 9)),
      });
    }
  }
  return { width, height, tiles };
}

function genomeFor(index, random) {
  const archetypes = [
    { name: 'Forager', metabolism: 0.78, curiosity: 0.45, sociality: 0.54, mobility: 0.65 },
    { name: 'Scholar', metabolism: 0.9, curiosity: 0.92, sociality: 0.62, mobility: 0.42 },
    { name: 'Cooperator', metabolism: 0.84, curiosity: 0.56, sociality: 0.95, mobility: 0.5 },
    { name: 'Explorer', metabolism: 0.96, curiosity: 0.76, sociality: 0.43, mobility: 0.94 },
  ];
  const base = archetypes[index % archetypes.length];
  const jitter = () => (random.next() - 0.5) * 0.12;
  return {
    archetype: base.name,
    metabolism: round(clamp(base.metabolism + jitter(), 0.55, 1.25)),
    curiosity: round(clamp(base.curiosity + jitter())),
    sociality: round(clamp(base.sociality + jitter())),
    mobility: round(clamp(base.mobility + jitter())),
    resilience: round(clamp(0.55 + random.next() * 0.4)),
  };
}

export function createOrganisms({ count = 100, world, seed = 0x0a61e17 } = {}) {
  if (!world) throw new TypeError('world is required');
  const random = new DeterministicRandom(seed);
  return Array.from({ length: count }, (_, index) => ({
    id: `life:${String(index + 1).padStart(3, '0')}`,
    generation: 1,
    x: random.int(0, world.width - 1),
    y: random.int(0, world.height - 1),
    energy: round(55 + random.next() * 35, 2),
    health: round(0.78 + random.next() * 0.22),
    ageDays: random.int(0, 240),
    genome: genomeFor(index, random),
    knowledge: [],
    relationships: {},
    lastAction: 'rest',
    observations: 0,
    experiments: 0,
    offspring: 0,
  }));
}

export function seasonAt(day) {
  const phase = Math.floor((day % 360) / 90);
  return ['spring', 'summer', 'autumn', 'winter'][phase];
}

function tileAt(world, x, y) {
  return world.tiles[tileIndex((x + world.width) % world.width, (y + world.height) % world.height, world.width)];
}

function regenerateTile(tile, season) {
  const seasonal = season === 'spring' ? 1.25 : season === 'summer' ? 1.05 : season === 'autumn' ? 0.82 : 0.48;
  const climateRate = tile.climate === 'temperate' ? 0.014 : tile.climate === 'oceanic' ? 0.012 : tile.climate === 'arid' ? 0.004 : 0.003;
  tile.biomass = round(clamp(tile.biomass + climateRate * seasonal));
  tile.moisture = round(clamp(tile.moisture + (tile.climate === 'oceanic' ? 0.002 : -0.0004)));
}

function chooseAction(agent, tile, random, localPopulation, activeStrategies = []) {
  const preferred = activeStrategies.find(strategy => strategy.climate === tile.climate);
  if (preferred && random.chance(0.18 + preferred.confidence * 0.22)) return preferred.action;
  if (agent.energy < 48 && tile.biomass > 0.03) return 'forage';
  if (agent.health < 0.55 || agent.energy < 24) return 'rest';
  const experimentProbability = agent.genome.curiosity * 0.055;
  if (random.chance(experimentProbability)) return 'experiment';
  if (localPopulation.length > 1 && random.chance(agent.genome.sociality * 0.1)) return 'share';
  if (random.chance(agent.genome.mobility * 0.22)) return 'move';
  return tile.biomass > 0.18 ? 'forage' : 'rest';
}

function addKnowledge(agent, knowledgeId) {
  if (!agent.knowledge.includes(knowledgeId)) {
    agent.knowledge.push(knowledgeId);
    if (agent.knowledge.length > 32) agent.knowledge.shift();
  }
}

function respawn(agent, world, random, day) {
  const oldGeneration = agent.generation;
  agent.generation += 1;
  agent.x = random.int(0, world.width - 1);
  agent.y = random.int(0, world.height - 1);
  agent.energy = round(68 + random.next() * 20, 2);
  agent.health = round(0.82 + random.next() * 0.18);
  agent.ageDays = 0;
  agent.knowledge = agent.knowledge.slice(-4);
  agent.relationships = {};
  agent.lastAction = 'rebirth';
  return { type: 'rebirth', day, agentId: agent.id, fromGeneration: oldGeneration, toGeneration: agent.generation };
}

export function advanceWorldDay(state, context) {
  const { random, encyclopedia, observationLedger, events } = context;
  state.day += 1;
  state.logicalTime += state.timeScale;
  const season = seasonAt(state.day);
  for (const tile of state.world.tiles) regenerateTile(tile, season);

  const populationByTile = new Map();
  for (const agent of state.organisms) {
    const key = `${agent.x}:${agent.y}`;
    if (!populationByTile.has(key)) populationByTile.set(key, []);
    populationByTile.get(key).push(agent);
  }

  let totalEnergy = 0;
  let totalKnowledge = 0;
  let deaths = 0;
  let experiments = 0;
  const actionCounts = Object.fromEntries(ACTIONS.map(action => [action, 0]));

  for (const agent of state.organisms) {
    const tile = tileAt(state.world, agent.x, agent.y);
    const local = populationByTile.get(`${agent.x}:${agent.y}`) ?? [agent];
    agent.ageDays += 1;
    agent.energy = round(agent.energy - (0.48 + agent.genome.metabolism * 0.34), 3);
    const crowding = Math.max(0, local.length - tile.carryingCapacity) * 0.008;
    agent.health = round(clamp(agent.health - crowding, 0, 1));
    const action = chooseAction(agent, tile, random, local, context.activeStrategies ?? []);
    agent.lastAction = action;
    actionCounts[action] += 1;

    if (action === 'forage') {
      const available = Math.max(0, tile.biomass * 18);
      const yieldEnergy = Math.min(7.5, available) * (0.72 + agent.genome.resilience * 0.28);
      tile.biomass = round(clamp(tile.biomass - yieldEnergy / 48));
      agent.energy = round(Math.min(100, agent.energy + yieldEnergy), 3);
      const claim = encyclopedia.observe({
        subject: `${tile.climate}.biomass`, relation: 'supports', object: 'body.energy',
        evidence: `observation:${agent.id}:day:${state.day}`, confidence: 0.61 + tile.biomass * 0.2,
        scope: `tile:${agent.x}:${agent.y}`,
      });
      addKnowledge(agent, claim.id);
      const key = `${tile.climate}|forage`;
      const stats = observationLedger.get(key) ?? { climate: tile.climate, action: 'forage', count: 0, reward: 0 };
      stats.count += 1;
      stats.reward += yieldEnergy;
      observationLedger.set(key, stats);
      agent.observations += 1;
    } else if (action === 'move') {
      const dx = random.int(-1, 1);
      const dy = random.int(-1, 1);
      agent.x = (agent.x + dx + state.world.width) % state.world.width;
      agent.y = (agent.y + dy + state.world.height) % state.world.height;
      agent.energy = round(Math.max(0, agent.energy - 0.7), 3);
    } else if (action === 'share') {
      const peers = local.filter(peer => peer.id !== agent.id);
      if (peers.length) {
        const peer = random.pick(peers);
        const availableKnowledge = agent.knowledge.filter(id => !peer.knowledge.includes(id));
        if (availableKnowledge.length) addKnowledge(peer, random.pick(availableKnowledge));
        agent.relationships[peer.id] = round(Math.min(1, (agent.relationships[peer.id] ?? 0) + 0.025));
        peer.relationships[agent.id] = round(Math.min(1, (peer.relationships[agent.id] ?? 0) + 0.02));
      }
    } else if (action === 'experiment') {
      experiments += 1;
      agent.experiments += 1;
      agent.energy = round(Math.max(0, agent.energy - 1.25), 3);
      const success = random.chance(0.25 + agent.genome.curiosity * 0.55);
      const claim = encyclopedia.observe({
        subject: `${tile.climate}.${success ? 'experiment-success' : 'experiment-failure'}`,
        relation: success ? 'supports' : 'constrains', object: 'knowledge.discovery',
        evidence: `experiment:${agent.id}:day:${state.day}`, confidence: success ? 0.74 : 0.58,
        scope: `tile:${agent.x}:${agent.y}`,
      });
      addKnowledge(agent, claim.id);
      const key = `${tile.climate}|experiment`;
      const stats = observationLedger.get(key) ?? { climate: tile.climate, action: 'experiment', count: 0, reward: 0 };
      stats.count += 1;
      stats.reward += success ? 1 : -0.25;
      observationLedger.set(key, stats);
    } else {
      agent.energy = round(Math.min(100, agent.energy + 0.45), 3);
      agent.health = round(clamp(agent.health + 0.003 * agent.genome.resilience), 4);
    }

    if (agent.energy <= 0 || agent.health <= 0.05 || agent.ageDays > 2200 + agent.genome.resilience * 900) {
      events.push(respawn(agent, state.world, random, state.day));
      deaths += 1;
    }
    totalEnergy += agent.energy;
    totalKnowledge += agent.knowledge.length;
  }

  if (events.length > 2048) events.splice(0, events.length - 2048);
  state.metrics = {
    population: state.organisms.length,
    averageEnergy: round(totalEnergy / state.organisms.length, 3),
    averageKnowledge: round(totalKnowledge / state.organisms.length, 3),
    encyclopediaEntries: encyclopedia.size,
    deathsToday: deaths,
    experimentsToday: experiments,
    actionCounts,
    season,
  };
  return state.metrics;
}
