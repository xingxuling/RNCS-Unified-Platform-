import { createHash } from 'node:crypto';

export function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

export function hash(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function withoutField(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
}

function check(condition, code, detail) {
  return { ok: Boolean(condition), code, detail };
}

export function verifyReplicatedAuthorityResult(result) {
  const checks = [];
  checks.push(check(result.format === 'rfe.replicated-authority-result.v0.5', 'format', result.format));
  checks.push(check(result.faultModel === 'crash-fault-majority-single-leader', 'fault_model', result.faultModel));
  checks.push(check(result.initialLeader === 'replica:a', 'initial_leader', result.initialLeader));
  checks.push(check(result.finalLeader === 'replica:b', 'final_leader', result.finalLeader));
  checks.push(check(result.finalTerm === 2, 'final_term', result.finalTerm));
  checks.push(check(result.quorum === 2, 'quorum', result.quorum));
  checks.push(check(result.clusterCommitIndex === 3, 'commit_index', result.clusterCommitIndex));

  const log = result.authorityLog ?? [];
  checks.push(check(log.length === 3, 'log_length', log.length));
  let previous = null;
  for (let offset = 0; offset < log.length; offset += 1) {
    const entry = log[offset];
    const expectedIndex = offset + 1;
    checks.push(check(entry.index === expectedIndex, `log_${expectedIndex}_index`, entry.index));
    checks.push(check(entry.previousEntryHash === previous, `log_${expectedIndex}_previous`, entry.previousEntryHash));
    const actualHash = hash(withoutField(entry, 'entryHash'));
    checks.push(check(entry.entryHash === actualHash, `log_${expectedIndex}_hash`, actualHash));
    previous = entry.entryHash;
  }
  checks.push(check(result.clusterLogHead === previous, 'cluster_log_head', result.clusterLogHead));
  checks.push(check(log.map((entry) => entry.term).join(',') === '1,1,2', 'term_sequence', log.map((entry) => entry.term)));
  checks.push(check(log.map((entry) => entry.leaderId).join(',') === 'replica:a,replica:a,replica:b', 'leader_sequence', log.map((entry) => entry.leaderId)));

  const stale = result.staleLeaderRejection ?? {};
  checks.push(check(stale.status === 'rejected', 'stale_status', stale.status));
  checks.push(check(stale.reasonCode === 'stale_leader_term', 'stale_reason', stale.reasonCode));
  checks.push(check(stale.suppliedTerm === 1 && stale.currentTerm === 2, 'stale_terms', stale));

  const convergence = result.healthyConvergence ?? {};
  checks.push(check(convergence.converged === true, 'healthy_convergence', convergence.converged));
  checks.push(check(convergence.identityCount === 1, 'healthy_identity_count', convergence.identityCount));
  checks.push(check((convergence.healthyReplicas ?? []).join(',') === 'replica:b,replica:c', 'healthy_replicas', convergence.healthyReplicas));

  const states = result.replicaStates ?? {};
  const b = states['replica:b'] ?? {};
  const c = states['replica:c'] ?? {};
  checks.push(check(b.online === true && b.role === 'leader', 'leader_state', b));
  checks.push(check(c.online === true && c.role === 'follower', 'follower_state', c));
  checks.push(check(b.appliedIndex === 3 && c.appliedIndex === 3, 'applied_index', [b.appliedIndex, c.appliedIndex]));
  checks.push(check(b.logHead === c.logHead && b.logHead === result.clusterLogHead, 'replica_log_head', [b.logHead, c.logHead]));
  checks.push(check(b.generationId === c.generationId && b.generationId === result.finalGenerationId, 'replica_generation', [b.generationId, c.generationId]));
  checks.push(check(b.semanticRoot === c.semanticRoot && b.semanticRoot === result.finalSemanticRoot, 'replica_semantic_root', [b.semanticRoot, c.semanticRoot]));
  checks.push(check(b.checkpointHash === c.checkpointHash && b.checkpointHash === result.finalCheckpointHash, 'replica_checkpoint', [b.checkpointHash, c.checkpointHash]));

  const metrics = result.metrics ?? {};
  checks.push(check(metrics.terms === 2, 'metric_terms', metrics.terms));
  checks.push(check(metrics.leaderFailovers === 1, 'metric_failovers', metrics.leaderFailovers));
  checks.push(check(metrics.staleLeaderRejections === 1, 'metric_stale_rejections', metrics.staleLeaderRejections));
  checks.push(check(metrics.verifiedRuntimeTransfers === 4, 'metric_transfers', metrics.verifiedRuntimeTransfers));
  checks.push(check(metrics.replicatedLogEntries === 5, 'metric_replicated_entries', metrics.replicatedLogEntries));
  checks.push(check(metrics.laggingReplicaCatchUpEntries === 2, 'metric_catch_up', metrics.laggingReplicaCatchUpEntries));
  checks.push(check(metrics.divergentHealthyReplicas === 0, 'metric_divergence', metrics.divergentHealthyReplicas));

  const resultHash = hash(withoutField(result, 'replicatedAuthorityResultHash'));
  checks.push(check(result.replicatedAuthorityResultHash === resultHash, 'result_hash', resultHash));
  return { ok: checks.every((item) => item.ok), checks, resultHash };
}

export function verifyAgainstFrozenC7(vector) {
  const result = structuredClone(vector.expected);
  const verification = verifyReplicatedAuthorityResult(result);
  return { ...verification, result };
}
