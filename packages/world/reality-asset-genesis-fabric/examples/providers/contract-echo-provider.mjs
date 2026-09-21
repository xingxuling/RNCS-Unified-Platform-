import fs from 'node:fs';

const request = JSON.parse(fs.readFileSync(0, 'utf8'));
const input = request.input ?? {};
const assetId = input.asset_id ?? input.genome?.identity?.asset_id ?? 'asset:external-process-smoke';
const seed = String(input.seed ?? input.genome?.seed ?? 'external-process-smoke-seed');
const operation = request.operation ?? 'generate';
const payload = JSON.stringify({
  provider_id: request.provider?.id ?? request.provider?.provider_id ?? null,
  operation,
  asset_id: assetId,
  seed
});
const marker = role => ({
  name: `contract/${role}.marker`,
  path: `contract/${role}.marker`,
  role,
  format: 'application/octet-stream',
  mime: 'application/octet-stream',
  base64: Buffer.from(`${payload}\nrole=${role}`, 'utf8').toString('base64')
});

process.stdout.write(JSON.stringify({
  asset_id: assetId,
  format: 'external-process-fixture/v0.1',
  quality_tier: input.quality_tier ?? 'PREVIEW',
  files: [
    marker('mesh-glb'),
    marker('pbr-texture-pack'),
    {
      name: 'external-process-smoke.json',
      path: 'metadata/external-process-smoke.json',
      role: 'metadata',
      format: 'application/json',
      mime: 'application/json',
      base64: Buffer.from(payload, 'utf8').toString('base64')
    }
  ],
  geometry: {triangle_count: 0, topology_status: 'NOT_APPLICABLE'},
  materials: {material_count: 0},
  pbr_channels: [],
  generator_version: 'contract-echo-provider-0.1.0',
  parameters: {operation, transport: 'stdin-json/stdout-json'},
  seed,
  source: {kind: 'deterministic-child-process-fixture'},
  provenance: {
    source_revision: 'fixture-v0.1.0',
    generator_version: 'contract-echo-provider-0.1.0',
    seed
  },
  evidence: {
    provider_success: true,
    representation: {status: 'CANDIDATE', execution: 'EXTERNAL_PROCESS_SMOKE'}
  },
  metadata: {
    external_process_smoke: true,
    candidate_only: true
  },
  metrics: {deterministic: true}
}));
