import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CognitiveDMLRuntime as DMLRuntime } from './cognitive-runtime-wrapper.mjs';

export async function createBridge({ manifest }) {
  const manifestDir = path.dirname(manifest.manifest_file);
  const stateDir = manifest.metadata?.state_dir ? path.resolve(manifestDir, manifest.metadata.state_dir) : path.resolve('output/dml-state');
  const runtime = new DMLRuntime({ stateDir });
  return {
    health: () => runtime.health(),
    invoke: async (action, payload) => {
      if (action === 'health') return runtime.health();
      if (action === 'describe') return runtime.describe();
      if (action === 'compileIntent') return runtime.compileIntent(payload.action || payload, payload.host || {});
      if (action === 'execute') return runtime.execute(payload.action || payload, payload.options || {});
      if (action === 'project') return runtime.project();
      if (action === 'readEvents') return runtime.readEvents();
      if (action === 'demo') return runtime.demo(payload || {});
      throw Object.assign(new Error(`Unsupported DML action: ${action}`), { code: 'DML_ACTION_UNSUPPORTED' });
    },
  };
}
