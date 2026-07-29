import { handleRclMcpMessage, listRclMcpTools } from '../../../../languages/reality-computation-language/src/rcl-mcp-server.mjs';
import { sha256 } from '../canonical.mjs';

function unwrap(response, tool) {
  if (!response) throw Object.assign(new Error(`RCL MCP returned no response for ${tool}.`), { code: 'RCL_EMPTY_RESPONSE' });
  if (response.error) throw Object.assign(new Error(response.error.message ?? `RCL MCP error for ${tool}.`), { code: `RCL_${response.error.code ?? 'TOOL_ERROR'}`, details: response.error.data });
  const result = response.result?.structuredContent ?? response.result;
  if (result?.text && Object.keys(result).length === 1) {
    try { return JSON.parse(result.text); } catch { return result.text; }
  }
  return result;
}

export class RclAdapter {
  constructor({ rclRoot, controlPlaneDir } = {}) {
    this.rclRoot = rclRoot;
    this.controlPlaneDir = controlPlaneDir;
  }

  async call(tool, args = {}) {
    const response = await handleRclMcpMessage(
      { jsonrpc: '2.0', id: `turi-${Date.now()}`, method: 'tools/call', params: { name: tool, arguments: args } },
      { defaultArguments: this.controlPlaneDir ? { controlPlaneDir: this.controlPlaneDir } : {} },
    );
    return unwrap(response, tool);
  }

  listTools() { return listRclMcpTools(); }

  status() { return this.call('rcl_status'); }
  packageMetadata() { return this.call('rcl_package_metadata'); }
  nativeVmStatus() { return this.call('rcl_native_vm_status'); }
  listExamples(input) { return this.call('rcl_list_examples', input); }
  search(input) { return this.call('rcl_search_repo', input); }
  readFile(input) { return this.call('rcl_read_repo_file', input); }
  compileSource(input) { return this.call('rcl_compile_source', input); }
  compileFile(input) { return this.call('rcl_compile_file', input); }
  disassembleSource(input) { return this.call('rcl_disassemble_source', input); }
  disassembleFile(input) { return this.call('rcl_disassemble_file', input); }
  runSource(input) { return this.call('rcl_run_native_source', input); }
  runFile(input) { return this.call('rcl_run_native_file', input); }
  selfhostInventory() { return this.call('rcl_selfhost_inventory'); }
  bootstrapSmoke() { return this.call('rcl_bootstrap_stage5_smoke'); }

  async compileRealityPlan({ source, language = 'RCL', targetRuntime = 'rncs.aetherworld-native' } = {}) {
    const compiled = await this.compileSource({ source, runNative: false });
    const plan = compiled?.plan ?? compiled?.authorityPlan ?? compiled;
    return {
      format: 'turi.compiled-reality-plan.v0.1',
      planId: plan?.plan_id ?? `plan:rcl:${sha256(source).slice(0, 24)}`,
      sourceHash: `sha256:${sha256(source)}`,
      language,
      compilerVersion: compiled?.compiler?.version ?? compiled?.compilerVersion ?? 'rcl-mcp-adapter',
      targetRuntime,
      variables: plan?.variables ?? plan?.objects ?? [],
      invariants: plan?.invariants ?? plan?.acceptance_rules ?? [],
      actions: plan?.actions ?? plan?.behaviors ?? [],
      authorityRequirements: plan?.authority_requirements ?? plan?.authorityRequirements ?? [],
      evidenceRequirements: plan?.evidence_requirements ?? plan?.evidenceRequirements ?? [],
      rollbackPolicy: plan?.rollback_policy ?? plan?.rollbackPolicy ?? { mode: 'reality-branch' },
      diagnostics: compiled?.diagnostics ?? [],
      source: compiled,
    };
  }

  async validateRealitySpec({ source } = {}) {
    const compiled = await this.compileSource({ source, runNative: false });
    return { valid: true, sourceHash: `sha256:${sha256(source)}`, compiler: compiled?.compiler ?? null, diagnostics: compiled?.diagnostics ?? [] };
  }

  adapterPlan(kind, intent) {
    return {
      format: `turi.${kind}-adapter-plan.v0.1`,
      implementation: 'adapter',
      evidenceLevel: 'static',
      intent,
      nativeSupport: false,
      limitations: [`No native ${kind} compiler was found in the RCL MCP surface; this is a typed adapter plan.`],
    };
  }
}
