#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { compileRealityToBytecode, runNativeBytecode } from '@taowind/reality-computation-language';
import { AetherEarthRuntime } from './runtime.mjs';
import { restoreReality } from './compression.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);

function output(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function compileRclFoundations() {
  const artifacts = [];
  for (const filename of fs.readdirSync(path.join(ROOT, 'rcl')).filter(name => name.endsWith('.rcl')).sort()) {
    const source = fs.readFileSync(path.join(ROOT, 'rcl', filename), 'utf8');
    const bytecode = compileRealityToBytecode(source);
    const execution = runNativeBytecode(bytecode);
    artifacts.push({ filename, byteLength: bytecode.length, state: execution.state });
  }
  return artifacts;
}

function buildWeb(outputDir = path.join(ROOT, 'dist-web')) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const filename of ['index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'sw.js']) {
    fs.copyFileSync(path.join(ROOT, 'web', filename), path.join(outputDir, filename));
  }
  const runtime = new AetherEarthRuntime({ seed: 20260704, organismCount: 100, knowledgeEntries: 512 });
  runtime.advance(30);
  fs.writeFileSync(path.join(outputDir, 'initial-state.json'), `${JSON.stringify(runtime.report(), null, 2)}\n`);
  return { outputDir, files: fs.readdirSync(outputDir).sort() };
}

async function main() {
  const [command = 'demo', arg] = process.argv.slice(2);
  const artifactDir = path.join(ROOT, 'evidence', 'latest');
  if (command === 'demo') {
    fs.mkdirSync(artifactDir, { recursive: true });
    const runtime = new AetherEarthRuntime({ seed: 20260704, artifactDir });
    runtime.setTimeScale(100);
    const advance = runtime.advance(365, { crystalInterval: 60 });
    const capsule = runtime.compress();
    const restored = AetherEarthRuntime.fromCapsule(capsule);
    const result = {
      format: 'aether-earth.demo.v0.1',
      advance,
      report: runtime.report(),
      compression: {
        originalBytes: capsule.originalBytes,
        compressedBytes: capsule.compressedBytes,
        ratio: capsule.ratio,
        restoredRoot: restored.root(),
        matched: restored.root() === runtime.root(),
      },
      rclFoundations: compileRclFoundations(),
    };
    fs.writeFileSync(path.join(artifactDir, 'demo.json'), `${JSON.stringify(result, null, 2)}\n`);
    output(result);
    return;
  }
  if (command === 'benchmark') {
    const runtime = new AetherEarthRuntime({ seed: 20260704 });
    const days = Number(arg ?? 3650);
    const started = performance.now();
    runtime.advance(days, { crystalInterval: 90 });
    const elapsedMs = performance.now() - started;
    const result = {
      format: 'aether-earth.benchmark.v0.1',
      days,
      organisms: runtime.state.organisms.length,
      agentDays: days * runtime.state.organisms.length,
      elapsedMs: Number(elapsedMs.toFixed(3)),
      agentDaysPerSecond: Math.round((days * runtime.state.organisms.length) / (elapsedMs / 1000)),
      report: runtime.report(),
    };
    output(result);
    return;
  }
  if (command === 'build-web') {
    output(buildWeb(arg ? path.resolve(arg) : undefined));
    return;
  }
  if (command === 'verify') {
    fs.mkdirSync(artifactDir, { recursive: true });
    const runtime = new AetherEarthRuntime({ seed: 424242, artifactDir });
    const before = runtime.root();
    const advance = runtime.advance(720, { crystalInterval: 45 });
    const capsule = runtime.compress();
    const rawRestored = restoreReality(capsule);
    const restored = AetherEarthRuntime.fromSnapshot(rawRestored);
    const foundations = compileRclFoundations();
    const web = buildWeb();
    const checks = {
      population100: runtime.state.organisms.length === 100,
      grid256: runtime.state.world.tiles.length === 256,
      rclpedia512Plus: runtime.encyclopedia.size >= 512,
      timeAdvanced: runtime.state.day === 720,
      realityChanged: before !== runtime.root(),
      reversibleCompression: restored.root() === runtime.root(),
      crystalGenerated: runtime.state.crystals.length > 0,
      crystalNativeVerified: runtime.state.crystals.every(crystal => crystal.status.includes('verified') || crystal.status.includes('promoted')),
      rclFoundationsExecutable: foundations.length === 4 && foundations.every(item => Object.keys(item.state).length >= 4),
      webBuilt: web.files.includes('index.html') && web.files.includes('app.js'),
    };
    const result = {
      format: 'aether-earth.verification.v0.1',
      passed: Object.values(checks).every(Boolean),
      checks,
      advance,
      report: runtime.report(),
      compression: { originalBytes: capsule.originalBytes, compressedBytes: capsule.compressedBytes, ratio: capsule.ratio },
      foundations,
    };
    fs.writeFileSync(path.join(artifactDir, 'verification.json'), `${JSON.stringify(result, null, 2)}\n`);
    output(result);
    if (!result.passed) process.exitCode = 1;
    return;
  }
  throw new Error(`unknown command: ${command}`);
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
