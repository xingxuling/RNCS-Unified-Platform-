#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RealityOneGateway, loadCapabilityRegistry } from '../src/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const registryPath = path.resolve(opt('--registry') ?? path.join(root, 'capabilities', 'capabilities.v0.1.json'));
const manifestDir = path.resolve(opt('--runtimes') ?? path.join(root, 'runtimes'));
const gateway = new RealityOneGateway({ manifestDirs: [manifestDir], dataDir: path.join(root, 'output', 'capability-registry-validation'), capabilityRegistryPath: null });
const runtimeRegistry = await gateway.discover();
const registry = loadCapabilityRegistry(registryPath, runtimeRegistry);
process.stdout.write(JSON.stringify({ status: 'PASS', capability_count: registry.capabilities.length, registry_root: registry.registry_root, runtime_registry_root: runtimeRegistry.registry_root }, null, 2) + '\n');
