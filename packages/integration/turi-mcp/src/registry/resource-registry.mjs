import { clone, boundedText } from '../canonical.mjs';

export class ResourceRegistry {
  constructor({ config, registry, adapters, receipts, artifacts, jobs, docs = {} }) {
    this.config = config;
    this.registry = registry;
    this.adapters = adapters;
    this.receipts = receipts;
    this.artifacts = artifacts;
    this.jobs = jobs;
    this.docs = docs;
  }

  list() {
    return [
      ['turi://server/info', 'TURI server info', 'application/json'],
      ['turi://capabilities/index', 'Typed capability registry', 'application/json'],
      ['turi://schemas/capability-manifest', 'CapabilityManifest schema', 'application/json'],
      ['turi://schemas/evidence-receipt', 'EvidenceReceipt schema', 'application/json'],
      ['turi://protocols/host-intervention', 'Host Intervention Protocol', 'application/json'],
      ['turi://rcl/status', 'RCL status', 'application/json'],
      ['turi://rncs/status', 'RNCS status', 'application/json'],
      ['turi://updia/status', 'UPDIA status', 'application/json'],
      ['turi://docs/integration', 'Integration notes', 'text/markdown'],
    ].map(([uri, name, mimeType]) => ({ uri, name, mimeType }));
  }

  async read(uri) {
    const value = await this.value(uri);
    return { contents: [{ uri, mimeType: uri.startsWith('turi://docs') ? 'text/markdown' : 'application/json', text: typeof value === 'string' ? boundedText(value, this.config.maxOutputBytes) : boundedText(JSON.stringify(value, null, 2), this.config.maxOutputBytes) }] };
  }

  async value(uri) {
    if (uri === 'turi://server/info') return { name: this.config.name, version: this.config.version, transport: ['stdio', 'streamable-http'], authorityMode: this.config.authorityMode, reasoningMode: this.config.reasoningMode, registry: this.registry.summary() };
    if (uri === 'turi://capabilities/index') return this.registry.search({ limit: 100 });
    if (uri === 'turi://schemas/capability-manifest') return { required: ['capabilityId', 'implementation', 'evidenceLevel', 'executionMode', 'authorityLevel', 'rollbackSupport'], enums: { implementation: ['native', 'adapter', 'provider', 'evidence_only', 'mock'], evidenceLevel: ['declared', 'static', 'executed', 'verified'], executionMode: ['read_only', 'candidate', 'authorized_write', 'external_effect'], authorityLevel: ['L0', 'L1', 'L2', 'L3', 'L4'], rollbackSupport: ['none', 'logical', 'snapshot', 'git', 'reality_branch'] } };
    if (uri === 'turi://schemas/evidence-receipt') return { format: 'turi.evidence-receipt.v0.1', fields: ['receiptId', 'timestamp', 'capabilityId', 'implementation', 'executionGrade', 'inputHash', 'outputHash', 'stateRootBefore', 'stateRootAfter', 'artifacts', 'warnings', 'limitations', 'rollbackRef'] };
    if (uri === 'turi://protocols/host-intervention') return {
      format: 'turi.host-intervention-protocol.v0.1',
      primaryReasoner: 'current MCP host model',
      flow: ['turi_request_host_reasoning', 'host produces typed contribution', 'turi_resume_with_host_contribution', 'RCL compile and/or RNCS isolated simulation', 'turi_record_assisted_experience'],
      permissions: [
        { level: 'L0', scope: 'retrieve/read/analyze', additionalAuthorization: false },
        { level: 'L1', scope: 'host reasoning and RCL draft', additionalAuthorization: false },
        { level: 'L2', scope: 'compile/test/isolated simulation', additionalAuthorization: false },
        { level: 'L3', scope: 'persistent experience or knowledge candidate', additionalAuthorization: 'policy' },
        { level: 'L4', scope: 'formal state/capability/external effect', additionalAuthorization: true },
      ],
      localGeneration: 'explicit offline fallback only',
      embedding: 'retained',
    };
    if (uri === 'turi://rcl/status') return this.adapters.rcl.status();
    if (uri === 'turi://rncs/status') return this.adapters.rncs.worldStatus();
    if (uri === 'turi://updia/status') return this.adapters.updia.status();
    if (uri === 'turi://docs/integration') return this.docs.integration ?? 'TURI integration documentation is packaged under docs/turi-mcp.';
    const job = uri.match(/^turi:\/\/jobs\/(.+)$/)?.[1];
    if (job) return this.jobs.store.get(decodeURIComponent(job));
    const receipt = uri.match(/^turi:\/\/evidence\/(.+)$/)?.[1];
    if (receipt) return this.receipts.get(decodeURIComponent(receipt));
    const artifact = uri.match(/^turi:\/\/artifacts\/(.+)$/)?.[1];
    if (artifact) return this.artifacts.read(decodeURIComponent(artifact));
    throw Object.assign(new Error(`Unknown TURI resource: ${uri}`), { code: 'RESOURCE_NOT_FOUND' });
  }
}
