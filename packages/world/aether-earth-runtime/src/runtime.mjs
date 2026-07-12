import fs from 'node:fs';
import path from 'node:path';
import { DeterministicRandom } from './prng.mjs';
import { createEarthGrid, createOrganisms, advanceWorldDay } from './world.mjs';
import { Rclpedia, generateSeedEntries } from './encyclopedia.mjs';
import { compressReality, restoreReality, compactHistory } from './compression.mjs';
import { crystallizeCollective } from './crystallization.mjs';
import { realityRoot } from './canonical.mjs';

function mapFromEntries(entries = []) {
  return new Map(entries.map(([key, value]) => [key, structuredClone(value)]));
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export class AetherEarthRuntime {
  constructor(options = {}) {
    const seed = Number(options.seed ?? 0x0a37e4f1) >>> 0;
    const world = createEarthGrid({ width: options.width ?? 16, height: options.height ?? 16, seed: seed ^ 0x71a91 });
    const organisms = createOrganisms({ count: options.organismCount ?? 100, world, seed: seed ^ 0x9e3779b9 });
    this.random = new DeterministicRandom(seed);
    this.encyclopedia = new Rclpedia(generateSeedEntries(options.knowledgeEntries ?? 512));
    this.observationLedger = new Map();
    this.events = [];
    this.artifactDir = options.artifactDir ?? null;
    this.lastCrystalDay = 0;
    this.state = {
      format: 'aether-earth.state.v0.1',
      seed,
      day: 0,
      logicalTime: 0,
      timeScale: 1,
      world,
      organisms,
      crystals: [],
      activeStrategies: [],
      metrics: {
        population: organisms.length,
        averageEnergy: average(organisms.map(agent => agent.energy)),
        averageKnowledge: 0,
        encyclopediaEntries: this.encyclopedia.size,
        deathsToday: 0,
        experimentsToday: 0,
        actionCounts: { forage: 0, move: 0, share: 0, experiment: 0, rest: 0 },
        season: 'spring',
      },
    };
  }

  setTimeScale(scale) {
    if (![1, 10, 100].includes(scale)) throw new RangeError('time scale must be 1, 10 or 100');
    this.state.timeScale = scale;
    return scale;
  }

  advance(days = 1, options = {}) {
    if (!Number.isInteger(days) || days < 0 || days > 365000) throw new RangeError('days must be an integer between 0 and 365000');
    const crystalInterval = options.crystalInterval ?? 90;
    const autoPromote = options.autoPromote ?? true;
    const beforeRoot = this.root();
    let crystalsCreated = 0;
    for (let step = 0; step < days; step += 1) {
      advanceWorldDay(this.state, {
        random: this.random,
        encyclopedia: this.encyclopedia,
        observationLedger: this.observationLedger,
        events: this.events,
        activeStrategies: this.state.activeStrategies,
      });
      if (this.state.day - this.lastCrystalDay >= crystalInterval) {
        const crystal = crystallizeCollective({
          observationLedger: this.observationLedger,
          epoch: this.state.crystals.length + 1,
          artifactDir: this.artifactDir ? path.join(this.artifactDir, 'crystals') : null,
        });
        this.lastCrystalDay = this.state.day;
        if (crystal) {
          if (autoPromote && crystal.support >= 24 && crystal.confidence >= 0.72) {
            crystal.promoted = true;
            crystal.status = 'promoted-after-native-verification';
            const climate = crystal.nativeState['crystal.climate'];
            const action = crystal.nativeState['crystal.action'];
            const confidence = crystal.nativeState['crystal.confidence'];
            if (!this.state.activeStrategies.some(strategy => strategy.climate === climate && strategy.action === action)) {
              this.state.activeStrategies.push({ id: crystal.id, climate, action, confidence });
            }
          }
          this.state.crystals.push(crystal);
          this.events.push({ type: 'collective-crystal', day: this.state.day, crystalId: crystal.id, promoted: crystal.promoted });
          crystalsCreated += 1;
        }
      }
    }
    return {
      daysAdvanced: days,
      day: this.state.day,
      beforeRoot,
      afterRoot: this.root(),
      crystalsCreated,
      metrics: structuredClone(this.state.metrics),
    };
  }

  eventLeap(days) {
    const result = this.advance(days, { crystalInterval: Math.max(30, Math.min(180, Math.floor(days / 4) || 90)) });
    return { ...result, mode: 'event-leap', compressedHistory: compactHistory(this.events) };
  }

  root() {
    return realityRoot(this.snapshot({ includeEncyclopedia: false }));
  }

  snapshot(options = {}) {
    return {
      ...structuredClone(this.state),
      randomState: this.random.state,
      lastCrystalDay: this.lastCrystalDay,
      observationLedger: [...this.observationLedger.entries()].sort(([a], [b]) => a.localeCompare(b)),
      events: structuredClone(this.events),
      encyclopedia: options.includeEncyclopedia === false ? undefined : this.encyclopedia.toJSON(),
    };
  }

  compress() {
    return compressReality(this.snapshot());
  }

  save(filePath) {
    const capsule = this.compress();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(capsule)}\n`);
    return capsule;
  }

  static fromSnapshot(snapshot, options = {}) {
    const runtime = Object.create(AetherEarthRuntime.prototype);
    runtime.state = structuredClone({
      format: snapshot.format,
      seed: snapshot.seed,
      day: snapshot.day,
      logicalTime: snapshot.logicalTime,
      timeScale: snapshot.timeScale,
      world: snapshot.world,
      organisms: snapshot.organisms,
      crystals: snapshot.crystals ?? [],
      activeStrategies: snapshot.activeStrategies ?? [],
      metrics: snapshot.metrics,
    });
    runtime.random = new DeterministicRandom(snapshot.randomState ?? snapshot.seed);
    runtime.encyclopedia = new Rclpedia(snapshot.encyclopedia ?? []);
    runtime.observationLedger = mapFromEntries(snapshot.observationLedger);
    runtime.events = structuredClone(snapshot.events ?? []);
    runtime.lastCrystalDay = snapshot.lastCrystalDay ?? 0;
    runtime.artifactDir = options.artifactDir ?? null;
    return runtime;
  }

  static fromCapsule(capsule, options = {}) {
    return AetherEarthRuntime.fromSnapshot(restoreReality(capsule), options);
  }

  report() {
    const topAgents = [...this.state.organisms]
      .sort((a, b) => b.knowledge.length - a.knowledge.length || b.energy - a.energy)
      .slice(0, 10)
      .map(agent => ({
        id: agent.id, generation: agent.generation, archetype: agent.genome.archetype,
        energy: agent.energy, knowledge: agent.knowledge.length, experiments: agent.experiments,
        position: [agent.x, agent.y], lastAction: agent.lastAction,
      }));
    return {
      format: 'aether-earth.report.v0.1',
      day: this.state.day,
      logicalTime: this.state.logicalTime,
      timeScale: this.state.timeScale,
      realityRoot: this.root(),
      world: { width: this.state.world.width, height: this.state.world.height, tiles: this.state.world.tiles.length },
      organisms: this.state.organisms.length,
      metrics: structuredClone(this.state.metrics),
      rclpedia: { entries: this.encyclopedia.size, topObserved: this.encyclopedia.topObserved(10) },
      crystals: this.state.crystals.map(crystal => ({
        id: crystal.id, strategy: crystal.strategy, confidence: crystal.confidence,
        support: crystal.support, promoted: crystal.promoted, bytecodeHash: crystal.bytecodeHash,
      })),
      activeStrategies: structuredClone(this.state.activeStrategies),
      history: compactHistory(this.events),
      topAgents,
    };
  }
}
