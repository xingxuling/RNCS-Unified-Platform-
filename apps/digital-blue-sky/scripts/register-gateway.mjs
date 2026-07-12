#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gatewayDir = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Usage: node scripts/register-gateway.mjs <gateway-directory>');
const runtimesDir = path.join(gatewayDir, 'runtimes');
if (!fs.existsSync(runtimesDir)) throw new Error(`Gateway runtimes directory not found: ${runtimesDir}`);
const template = JSON.parse(fs.readFileSync(path.join(root, 'integration/reality-one/dml.runtime.template.json'), 'utf8'));
template.transport.args = [path.join(root, 'src/stdio-runtime.mjs')];
template.transport.cwd = root;
const target = path.join(runtimesDir, 'dml-core.runtime.json');
fs.writeFileSync(target, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ status: 'registered', target, runtime_id: template.runtime_id }, null, 2)}\n`);
