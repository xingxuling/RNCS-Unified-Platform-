import {clone, lifecycleFields, NATIVE_VISUAL_VERSION, rootHash, seal} from './canonical.mjs';
import {applyBodyRepair, validateBodyGraph} from './morphogenesis.mjs';

export const RESIDUAL_REPORT_FORMAT = 'rncs.visual-residual-report.v0.1';

export function detectVisualResiduals({body, frames=[]}={}) {
  const residuals = [];
  const clearance = Number(body?.hair_rig?.clearance ?? 0);
  if (clearance < .04) residuals.push({residual_id: 'hair-face-clearance', category: 'occlusion', severity: 'medium', frames: frames.length ? [Math.floor(frames.length * .46), Math.floor(frames.length * .72)] : [], observed: clearance, threshold: .04, root_cause: {object: 'HairRig', field: 'clearance', root: body?.hair_rig?.hair_rig_root}, repair_target: 'hair_rig.clearance'});
  if (!(body?.invariants?.connected === true)) residuals.push({residual_id: 'body-topology-disconnected', category: 'topology', severity: 'high', frames: [], observed: false, root_cause: {object: 'BodyTopology', root: body?.topology?.topology_root}, repair_target: 'body_graph'});
  const invalidFrame = frames.find(frame => !frame?.frame_root && !frame?.render_root);
  if (invalidFrame) residuals.push({residual_id: 'frame-root-missing', category: 'evidence', severity: 'high', frames: [invalidFrame.frame_number], observed: 'missing', root_cause: {object: 'NativeFrameState', frame: invalidFrame.frame_number}, repair_target: 'renderer'});
  const report = {
    format: RESIDUAL_REPORT_FORMAT, version: NATIVE_VISUAL_VERSION, status: residuals.some(item => item.severity === 'high') ? 'fail' : residuals.length ? 'repairable' : 'pass',
    checked_frames: frames.length, residuals, detected_by: 'rncs-native-visual-feedback-runtime',
    ...lifecycleFields({provenance: {source: 'Native Frame Evidence', frame_count: frames.length}, dependencies: [body?.body_graph_root, ...frames.map(item => item.frame_root ?? item.render_root).filter(Boolean)], authority: 'RNCS candidate residual evidence', rollback: 'restore-prior-frame-sequence'}),
    residual_report_root: ''
  };
  return seal(report, 'residual_report_root');
}

export function createVisualRepairCandidate({body, residualReport, frameRange=null, reason='hair-face-clearance'}={}) {
  const residual = residualReport?.residuals?.find(item => item.residual_id === reason) ?? residualReport?.residuals?.[0];
  const range = frameRange ?? [residual?.frames?.[0] ?? 0, residual?.frames?.[1] ?? 0];
  const candidateBody = residual?.repair_target === 'hair_rig.clearance' ? applyBodyRepair(body, {hair_clearance: .065}) : clone(body);
  const candidate = {
    format: 'rncs.visual-repair-candidate.v0.1', version: NATIVE_VISUAL_VERSION, candidate_id: `repair:${rootHash({body: body.body_graph_root, residual: residualReport?.residual_report_root, range}) .slice(0, 24)}`,
    status: 'candidate', reason: residual?.residual_id ?? reason, source_body_graph_root: body?.body_graph_root ?? null, candidate_body_graph_root: candidateBody.body_graph_root,
    target: residual?.repair_target ?? 'renderer', frame_range: {start: Math.min(...range), end: Math.max(...range)}, scope: 'local-frame-rebuild', roots_unchanged: {episode_intent: true, character_identity: candidateBody.identity_root === body.identity_root},
    ...lifecycleFields({provenance: {source: 'VisualResidualReport', residual_report_root: residualReport?.residual_report_root}, dependencies: [body?.body_graph_root, residualReport?.residual_report_root].filter(Boolean), authority: 'RNCS candidate repair', rollback: 'reject-candidate-and-restore-source-body'}),
    repair_candidate_root: ''
  };
  return {candidate: seal(candidate, 'repair_candidate_root'), candidateBody};
}

export function validateRepairCandidate({body, candidate, baseFrames=[], candidateFrames=[]}={}) {
  const errors = [];
  const bodyValidation = validateBodyGraph(candidate?.candidateBody ?? body);
  if (!bodyValidation.valid) errors.push(...bodyValidation.errors);
  if (candidate?.roots_unchanged?.character_identity !== true) errors.push('REPAIR_IDENTITY_ROOT_CHANGED');
  const start = candidate?.frame_range?.start ?? 0, end = candidate?.frame_range?.end ?? -1;
  const baseByFrame = new Map(baseFrames.map(item => [item.frame_number, item.frame_root ?? item.render_root]));
  for (const item of candidateFrames) if (item.frame_number < start || item.frame_number > end) errors.push(`REPAIR_SCOPE_EXPANDED:${item.frame_number}`);
  const changed = candidateFrames.filter(item => baseByFrame.get(item.frame_number) !== (item.frame_root ?? item.render_root)).map(item => item.frame_number);
  if (!changed.length && candidateFrames.length) errors.push('REPAIR_NO_LOCAL_CHANGE');
  return {valid: errors.length === 0, errors, changed_frames: changed, unaffected_frames_preserved: baseFrames.filter(item => item.frame_number < start || item.frame_number > end).every(item => !candidateFrames.some(next => next.frame_number === item.frame_number))};
}

export function createRepairReceipt({candidate, validation, beforeRoot, afterRoot, accepted=true}={}) {
  return seal({format: 'rncs.visual-repair-receipt.v0.1', version: NATIVE_VISUAL_VERSION, candidate_root: candidate?.repair_candidate_root ?? null, status: accepted && validation?.valid ? 'committed-local' : 'rejected', accepted: Boolean(accepted && validation?.valid), before_sequence_root: beforeRoot, after_sequence_root: afterRoot, changed_frames: validation?.changed_frames ?? [], scope: candidate?.frame_range ?? null, roots_unchanged: candidate?.roots_unchanged ?? {}, reject_restore_available: true, validation: clone(validation ?? {})}, 'repair_receipt_root');
}
