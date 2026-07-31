import fs from 'node:fs';
import path from 'node:path';
import { spawn as defaultSpawn } from 'node:child_process';
import { confinedPath } from '../security/policy.mjs';
import { randomId, sha256 } from '../canonical.mjs';

export class GameBrainAdapter {
  constructor({ config, dataDir, spawn = defaultSpawn } = {}) {
    this.config = config;
    this.dataDir = dataDir;
    this.spawn = spawn;
  }

  status() {
    const configured = Boolean(this.config.gamebrainCli && this.config.gamebrainRoot && fs.existsSync(this.config.gamebrainCli));
    return {
      configured,
      implementation: 'provider',
      provider: 'worldseed-gamebrain',
      cli: configured ? this.config.gamebrainCli : null,
      root: configured ? this.config.gamebrainRoot : null,
      capabilities: ['seeded_simulation', 'bounded_ticks', 'replay_candidate'],
      limits: { maxTicks: 10_000 },
      limitations: configured ? [] : ['Set TURI_GAMEBRAIN_ROOT to enable WorldSeed/GameBrain provider calls.'],
    };
  }

  async simulate({ seed, ticks = 1, actors } = {}, { timeoutMs = 180_000 } = {}) {
    const status = this.status();
    if (!status.configured) {
      const error = new Error('GameBrain provider is not configured.');
      error.code = 'GAMEBRAIN_NOT_CONFIGURED';
      throw error;
    }
    const seedPath = confinedPath(this.config.gamebrainRoot, seed, { allowAbsolute: true });
    if (!fs.existsSync(seedPath)) {
      const error = new Error(`GameBrain seed does not exist: ${seed}`);
      error.code = 'GAMEBRAIN_SEED_NOT_FOUND';
      throw error;
    }
    let seedPayload;
    let seedText;
    try {
      seedText = fs.readFileSync(seedPath, 'utf8');
      seedPayload = JSON.parse(seedText);
    } catch (error) {
      const invalid = new Error(`GameBrain seed is not valid JSON: ${seed}`);
      invalid.code = 'GAMEBRAIN_SEED_INVALID';
      invalid.details = { cause: error.message };
      throw invalid;
    }
    const actorContainer = seedPayload?.actors ?? seedPayload?.subjects ?? null;
    const actorCount = actorContainer
      ? (Array.isArray(actorContainer) ? actorContainer.length : Object.keys(actorContainer).length)
      : null;
    const actorBudget = actors === undefined || actors === null ? null : Number(actors);
    if (actorBudget !== null && (!Number.isInteger(actorBudget) || actorBudget < 1)) {
      const error = new Error('GameBrain actors must be a positive integer when supplied.');
      error.code = 'INVALID_GAMEBRAIN_ACTOR_BUDGET';
      throw error;
    }
    if (actorBudget !== null && actorCount !== null && actorCount > actorBudget) {
      const error = new Error(`GameBrain seed contains ${actorCount} actors, above the requested budget ${actorBudget}.`);
      error.code = 'GAMEBRAIN_ACTOR_BUDGET_EXCEEDED';
      error.details = { actorCount, actorBudget };
      throw error;
    }
    const outputDir = path.join(this.dataDir, 'gamebrain');
    fs.mkdirSync(outputDir, { recursive: true });
    const output = path.join(outputDir, `${randomId('snapshot').replace(':', '-')}.json`);
    const boundedTicks = Math.min(Math.max(Number(ticks) || 1, 1), 10_000);
    const startedAt = process.hrtime.bigint();
    return new Promise((resolve, reject) => {
      const child = this.spawn(process.execPath, [this.config.gamebrainCli, 'simulate', seedPath, '--ticks', String(boundedTicks), '--output', output], { cwd: this.config.gamebrainRoot, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => { child.kill(); const error = new Error(`GameBrain simulation exceeded ${timeoutMs}ms.`); error.code = 'GAMEBRAIN_TIMEOUT'; reject(error); }, timeoutMs);
      child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk.toString('utf8')}`.slice(-4_000); });
      child.on('error', (error) => { clearTimeout(timer); error.code = 'GAMEBRAIN_SPAWN_FAILED'; reject(error); });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          const error = new Error(`GameBrain simulation exited with code ${code}.`);
          error.code = 'GAMEBRAIN_EXIT_NONZERO';
          error.details = { stderr, stdout: stdout.slice(0, 2_000) };
          reject(error);
          return;
        }
        let report = null;
        if (fs.existsSync(output)) {
          try { report = JSON.parse(fs.readFileSync(output, 'utf8')); } catch (error) { error.code = 'GAMEBRAIN_OUTPUT_INVALID'; reject(error); return; }
        }
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        resolve({
          status: 'completed',
          ticks: boundedTicks,
          actors: actorCount,
          actorBudget,
          seedHash: `sha256:${sha256(seedText)}`,
          outputPath: output,
          outputHash: `sha256:${sha256(report ?? stdout)}`,
          elapsedMs: Math.round(elapsedMs * 1000) / 1000,
          report,
          stdout: stdout.slice(-2_000),
        });
      });
    });
  }
}
