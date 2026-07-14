import path from 'node:path';
import { AetherworldRNCSNativeRuntime } from '@taowind/aether-rncs-bridge';

function expectedState(payload = {}) {
  return {
    stateRoot: payload.expectedStateRoot ?? payload.expected_state_root,
    revision: payload.expectedRevision ?? payload.expected_revision,
  };
}

function assertStatePrecondition(before, payload = {}) {
  const expected = expectedState(payload);
  if (expected.stateRoot !== undefined && expected.stateRoot !== before.state_root) {
    throw Object.assign(new Error('RCL_AUTHORITY_STATE_ROOT_MISMATCH'), {
      code: 'RCL_AUTHORITY_STATE_ROOT_MISMATCH',
      details: { expected: expected.stateRoot, actual: before.state_root },
    });
  }
  if (expected.revision !== undefined && Number(expected.revision) !== before.revision) {
    throw Object.assign(new Error('RCL_AUTHORITY_REVISION_MISMATCH'), {
      code: 'RCL_AUTHORITY_REVISION_MISMATCH',
      details: { expected: Number(expected.revision), actual: before.revision },
    });
  }
}

function compactCandidate(candidate) {
  return {
    candidate_id: candidate.candidate_id,
    baseline_root: candidate.baseline_root,
    baseline_revision: candidate.baseline_revision,
    candidate_status: candidate.status,
    candidate_root: candidate.candidate_root ?? null,
    expected_changes: candidate.expected_changes,
  };
}

export async function createBridge({module, manifest}) {
  const health = () => ({
    status: 'ok',
    protocol: 'rncs.rcl-control.v0.4',
    rcl_language_version: module.RCL_LANGUAGE_VERSION,
    rcl_bytecode_version: module.RCL_BYTECODE_VERSION,
    native_execution: true,
    parity_verification: true,
    authority_plan_compilation: true,
    authority_commit: true,
  });
  const aetherDataDir = path.resolve(path.dirname(manifest.manifest_file), '../output/aetherworld-native');
  const createAetherRuntime = () => new AetherworldRNCSNativeRuntime({ dataDir: aetherDataDir });

  const compileAuthorityPlan = async (payload = {}) => {
    const runtime = createAetherRuntime();
    const before = runtime.worldStatus();
    assertStatePrecondition(before, payload);
    const execution = await module.compileRclSource(payload.source, {
      verifyParity: payload.verifyParity !== false,
      timeout: Number(payload.timeout ?? 30_000),
    });
    const compiled = await module.compileRclAuthorityPlan(payload.source, {
      execution,
      subjectId: payload.subjectId ?? payload.subject_id,
      roles: payload.roles ?? payload.approvalRoles ?? payload.approval_roles,
      baselineGeneration: before.revision,
      riskLevel: payload.riskLevel ?? payload.risk_level,
    });
    const validation = runtime.validatePlan({ plan: compiled.plan });
    if (!validation.valid) {
      throw Object.assign(new Error(`RCL_AUTHORITY_PLAN_INVALID:${validation.errors.join(',')}`), {
        code: 'RCL_AUTHORITY_PLAN_INVALID',
        details: validation,
      });
    }
    return {
      format: 'rncs.rcl-authority-plan-workflow.v0.1',
      before,
      execution,
      plan: compiled.plan,
      changes: compiled.changes,
      state_root: compiled.stateRoot,
      validation,
    };
  };

  const runAuthorityWorkflow = async (payload = {}) => {
    const runtime = createAetherRuntime();
    const before = runtime.worldStatus();
    assertStatePrecondition(before, payload);
    const approvalRoles = payload.approvalRoles ?? payload.approval_roles;
    const execution = await module.compileRclSource(payload.source, {
      verifyParity: payload.verifyParity !== false,
      timeout: Number(payload.timeout ?? 30_000),
    });
    const compiled = await module.compileRclAuthorityPlan(payload.source, {
      execution,
      subjectId: payload.subjectId ?? payload.subject_id,
      roles: payload.roles ?? approvalRoles ?? ['rcl-author'],
      baselineGeneration: before.revision,
      riskLevel: payload.riskLevel ?? payload.risk_level,
    });
    const validation = runtime.validatePlan({ plan: compiled.plan });
    if (!validation.valid) {
      throw Object.assign(new Error(`RCL_AUTHORITY_PLAN_INVALID:${validation.errors.join(',')}`), {
        code: 'RCL_AUTHORITY_PLAN_INVALID',
        details: validation,
      });
    }
    const candidate = runtime.createCandidate({ plan: compiled.plan });
    const simulation = await runtime.simulateCandidate({ candidateId: candidate.candidate_id });
    const authority = runtime.authorizeCandidate({
      candidateId: candidate.candidate_id,
      approvalRoles: approvalRoles ?? [],
    });
    const requiredDecisions = authority.decisions.filter(item => item.action !== 'delete_world_object');
    const authorized = requiredDecisions.length > 0 && requiredDecisions.every(item => item.status === 'approved');
    const commit = payload.commit === true;
    if (commit && (expectedState(payload).stateRoot === undefined || expectedState(payload).revision === undefined)) {
      throw Object.assign(new Error('RCL_AUTHORITY_PRECONDITION_REQUIRED'), { code: 'RCL_AUTHORITY_PRECONDITION_REQUIRED' });
    }
    if (commit && !Array.isArray(approvalRoles)) {
      throw Object.assign(new Error('RCL_AUTHORITY_APPROVAL_ROLES_REQUIRED'), { code: 'RCL_AUTHORITY_APPROVAL_ROLES_REQUIRED' });
    }
    if (!commit) {
      return {
        format: 'rncs.rcl-authority-workflow.v0.1',
        status: authorized ? 'authorized-candidate' : 'candidate-awaiting-authority',
        committed: false,
        candidate_persisted: false,
        before,
        execution,
        plan: { plan_id: compiled.plan.plan_id, state_root: compiled.stateRoot, changes: compiled.changes },
        candidate: compactCandidate(candidate),
        simulation: { status: simulation.execution_receipt?.status, evidence_root: simulation.evidence_root },
        authority: { summary: authority.summary, authority_root: authority.authority_root, authorized },
        after: runtime.worldStatus(),
      };
    }
    if (!authorized) {
      throw Object.assign(new Error('RCL_AUTHORITY_APPROVAL_REQUIRED'), {
        code: 'RCL_AUTHORITY_APPROVAL_REQUIRED',
        details: { authority },
      });
    }
    if (execution.parity?.ok !== true) {
      throw Object.assign(new Error('RCL_NATIVE_PARITY_REQUIRED'), {
        code: 'RCL_NATIVE_PARITY_REQUIRED',
        details: { parity: execution.parity },
      });
    }
    const beforeMerge = runtime.worldStatus();
    assertStatePrecondition(beforeMerge, { expectedStateRoot: before.state_root, expectedRevision: before.revision });
    const merge = await runtime.mergeCandidate({ candidateId: candidate.candidate_id });
    const after = runtime.worldStatus();
    return {
      format: 'rncs.rcl-authority-workflow.v0.1',
      status: 'committed',
      committed: true,
      before,
      execution,
      plan: { plan_id: compiled.plan.plan_id, state_root: compiled.stateRoot, changes: compiled.changes },
      candidate: compactCandidate(candidate),
      simulation: { status: simulation.execution_receipt?.status, evidence_root: simulation.evidence_root },
      authority: { summary: authority.summary, authority_root: authority.authority_root, authorized },
      merge,
      after,
      changed: before.state_root !== after.state_root && after.revision > before.revision,
    };
  };

  return {
    health,
    invoke: async (action, payload = {}) => {
      if (action === 'health') return health();
      if (action === 'compileExecute') {
        return module.compileRclSource(payload.source, {
          verifyParity: payload.verifyParity !== false,
          timeout: Number(payload.timeout ?? 30_000),
        });
      }
      if (action === 'compileAuthorityPlan') return compileAuthorityPlan(payload);
      if (action === 'authorityWorkflow') return runAuthorityWorkflow(payload);
      if (action === 'controlPlane') return module.buildRclControlPlane();
      throw Object.assign(new Error(`Unsupported RCL control action: ${action}`), { code: 'RCL_CONTROL_ACTION_UNSUPPORTED' });
    },
  };
}
