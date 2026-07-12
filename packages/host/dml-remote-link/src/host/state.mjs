import fs from 'node:fs';
import path from 'node:path';
import { now } from '../shared/canonical.mjs';
import { ensureEd25519KeyPair } from '../shared/crypto.mjs';

function atomicWrite(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

export class HostState {
  constructor(root = 'state/host') {
    this.root = path.resolve(root);
    this.configFile = path.join(this.root, 'host-config.json');
    this.ledgerFile = path.join(this.root, 'execution-ledger.json');
    this.keys = ensureEd25519KeyPair(path.join(this.root, 'keys'), 'host');
    fs.mkdirSync(this.root, { recursive: true });
    if (!fs.existsSync(this.ledgerFile)) atomicWrite(this.ledgerFile, { format: 'dml.host-ledger.v0.3', receipts: {} });
  }

  saveConfig(config) {
    atomicWrite(this.configFile, { ...config, saved_at: now() });
    return config;
  }

  readConfig() {
    if (!fs.existsSync(this.configFile)) throw new Error(`Host is not paired: ${this.configFile}`);
    return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
  }

  readLedger() {
    return JSON.parse(fs.readFileSync(this.ledgerFile, 'utf8'));
  }

  receipt(actionId) {
    return this.readLedger().receipts[actionId] || null;
  }

  saveReceipt(actionId, receipt) {
    const ledger = this.readLedger();
    ledger.receipts[actionId] = receipt;
    const ids = Object.keys(ledger.receipts);
    if (ids.length > 1000) {
      for (const id of ids.slice(0, ids.length - 1000)) delete ledger.receipts[id];
    }
    atomicWrite(this.ledgerFile, ledger);
    return receipt;
  }
}
