import {clone, lifecycleFields, NATIVE_VISUAL_VERSION, rootHash, seal} from './canonical.mjs';

export const PERFORMANCE_PLAN_FORMAT = 'rncs.performance-plan.v0.1';
const clamp01 = value => Math.max(0, Math.min(1, Number(value)));
const smooth = value => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const smoother = value => { const t = clamp01(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const round = value => Number(Number(value).toFixed(6));

function stage(id, start, end, easing='smoothstep') { return {stage_id: id, start_frame: start, end_frame: end, easing}; }
function sampleStages(stages, frame) {
  const active = stages.find(item => frame >= item.start_frame && frame <= item.end_frame) ?? stages.at(-1);
  const t = active.end_frame === active.start_frame ? 1 : clamp01((frame - active.start_frame) / (active.end_frame - active.start_frame));
  const eased = active.easing === 'smootherstep' ? smoother(t) : active.easing === 'linear' ? t : smooth(t);
  return {stage: active.stage_id, t: eased};
}
function curve(name, points, law='smootherstep') { return {curve_id: name, law, points: points.map(item => ({frame: item.frame, value: item.value}))}; }
function sampleCurve(item, frame) {
  const points = item.points;
  if (frame <= points[0].frame) return points[0].value;
  if (frame >= points.at(-1).frame) return points.at(-1).value;
  const index = points.findIndex((point, i) => frame >= point.frame && frame <= points[i + 1].frame);
  const left = points[index], right = points[index + 1];
  const t = (frame - left.frame) / (right.frame - left.frame || 1);
  return lerp(left.value, right.value, item.law === 'linear' ? t : item.law === 'smoothstep' ? smooth(t) : smoother(t));
}

export function createPerformancePlan({fps=24, frameCount=120, shotId='native-shot-001', dialogueTimeline=null}={}) {
  const stages = [stage('prep', 0, 16), stage('rise', 17, 38), stage('main-action', 39, 72), stage('decelerate', 73, 91), stage('overshoot', 92, 103), stage('settle', 104, frameCount - 1)];
  const curves = [
    curve('gaze-x', [{frame: 0, value: -.55}, {frame: 25, value: -.5}, {frame: 48, value: .38}, {frame: 72, value: .54}, {frame: 100, value: .58}, {frame: 119, value: .56}]),
    curve('head-yaw', [{frame: 0, value: -.28}, {frame: 34, value: -.27}, {frame: 59, value: .13}, {frame: 82, value: .3}, {frame: 98, value: .34}, {frame: 119, value: .31}]),
    curve('torso-yaw', [{frame: 0, value: -.06}, {frame: 45, value: -.05}, {frame: 74, value: .08}, {frame: 99, value: .14}, {frame: 119, value: .11}]),
    curve('shoulder-follow', [{frame: 0, value: 0}, {frame: 52, value: 0}, {frame: 78, value: .12}, {frame: 102, value: .18}, {frame: 119, value: .15}]),
    curve('weight-shift', [{frame: 0, value: -.02}, {frame: 38, value: -.03}, {frame: 72, value: .08}, {frame: 96, value: .14}, {frame: 119, value: .1}]),
    curve('alertness', [{frame: 0, value: .12}, {frame: 35, value: .16}, {frame: 70, value: .72}, {frame: 99, value: .9}, {frame: 119, value: .82}]),
    curve('breath', [{frame: 0, value: .18}, {frame: 25, value: .26}, {frame: 50, value: .16}, {frame: 78, value: .3}, {frame: 105, value: .17}, {frame: 119, value: .22}])
  ];
  const chains = [
    {chain_id: 'hair-follow-through', driver_curve_id: 'head-yaw', lag_frames: 3, damping: .72, amplitude: .11, mode: 'velocity-lag'},
    {chain_id: 'costume-follow-through', driver_curve_id: 'torso-yaw', lag_frames: 5, damping: .58, amplitude: .08, mode: 'delayed-settle'},
    {chain_id: 'shoulder-inertia', driver_curve_id: 'weight-shift', lag_frames: 2, damping: .66, amplitude: .05, mode: 'weight-follow'}
  ];
  const intent = {
    format: 'rncs.performance-intent.v0.1', version: NATIVE_VISUAL_VERSION, shot_id: shotId, start_state: 'looking-offscreen-calm', end_state: 'alert-confirmed',
    beats: ['hear-signal', 'eyes-lead', 'head-follows', 'weight-follows', 'settle'], gaze_leads_head_by_frames: 10, constraints: ['feet-contact', 'identity-locked', 'joint-limits', 'face-anchor-stable']
  };
  const plan = {
    format: PERFORMANCE_PLAN_FORMAT, version: NATIVE_VISUAL_VERSION, performance_id: `performance:${shotId}`, fps, frame_count: frameCount,
    intent, stages, curves, secondary_motion_chains: chains, dialogue_timeline: dialogueTimeline,
    receipt: {format: 'rncs.performance-receipt.v0.1', version: NATIVE_VISUAL_VERSION, anticipation: true, overshoot: true, settle: true, curve_root: rootHash(curves), stage_root: rootHash(stages)},
    ...lifecycleFields({provenance: {source: 'Episode Shot Intent', shot_id: shotId}, dependencies: [shotId], authority: 'RNCS derived performance state', rollback: 'restore-shot-intent-root'}),
    performance_root: ''
  };
  return seal(plan, 'performance_root');
}

export function samplePerformanceFrame(plan, frameNumber) {
  const frame = Math.max(0, Math.min(plan.frame_count - 1, Math.round(frameNumber)));
  const values = Object.fromEntries(plan.curves.map(item => [item.curve_id, round(sampleCurve(item, frame))]));
  const stageState = sampleStages(plan.stages, frame);
  const velocity = (curveId, delta=2) => round((sampleCurve(plan.curves.find(item => item.curve_id === curveId), frame) - sampleCurve(plan.curves.find(item => item.curve_id === curveId), Math.max(0, frame - delta))) / delta);
  const headVelocity = velocity('head-yaw'), torsoVelocity = velocity('torso-yaw');
  const secondary = {
    hair_follow_through: round(headVelocity * .11 * (1 + (stageState.stage === 'overshoot' ? .8 : 0))),
    costume_follow_through: round(torsoVelocity * .08 * (1 + (stageState.stage === 'overshoot' ? .5 : 0))),
    shoulder_inertia: round(velocity('weight-shift') * .05),
    breathing: values.breath
  };
  const pose = {
    gaze_x: values['gaze-x'], gaze_y: .02 + values.alertness * .015, head_yaw: values['head-yaw'], head_pitch: -.015 + values.alertness * .025,
    torso_yaw: values['torso-yaw'], shoulder_follow: values['shoulder-follow'], weight_shift: values['weight-shift'], alertness: values.alertness,
    blink: (frame >= 42 && frame <= 45) || (frame >= 101 && frame <= 103), eye_openness: ((frame >= 42 && frame <= 45) || (frame >= 101 && frame <= 103)) ? 0 : 1,
    brow_raise: values.alertness * .42, jaw_open: values.alertness * .08, mouth_shape: values.alertness > .65 ? 'a' : 'closed'
  };
  const result = {
    format: 'rncs.performance-frame.v0.1', version: NATIVE_VISUAL_VERSION, performance_root: plan.performance_root, frame_number: frame, time_seconds: round(frame / plan.fps),
    phase: stageState.stage, pose, curves: values, secondary_motion: secondary,
    motion_vector: {head_yaw: headVelocity, torso_yaw: torsoVelocity, weight_shift: velocity('weight-shift')},
    pose_root: rootHash(pose), transition_root: rootHash({phase: stageState.stage, previous: Math.max(0, frame - 1)}), curve_root: rootHash(values), secondary_motion_root: rootHash(secondary), performance_frame_root: ''
  };
  return seal(result, 'performance_frame_root');
}

export function validatePerformancePlan(plan) {
  const errors = [];
  if (plan?.format !== PERFORMANCE_PLAN_FORMAT) errors.push('PERFORMANCE_PLAN_FORMAT_INVALID');
  if (!Array.isArray(plan?.stages) || plan.stages.length < 6) errors.push('PERFORMANCE_STAGES_INCOMPLETE');
  for (const required of ['prep', 'rise', 'main-action', 'decelerate', 'overshoot', 'settle']) if (!plan?.stages?.some(item => item.stage_id === required)) errors.push(`PERFORMANCE_STAGE_MISSING:${required}`);
  if (!plan?.receipt?.anticipation || !plan?.receipt?.overshoot || !plan?.receipt?.settle) errors.push('PERFORMANCE_RECEIPT_PHASES_MISSING');
  for (const item of plan?.curves ?? []) if (!item.points?.length) errors.push(`PERFORMANCE_CURVE_EMPTY:${item.curve_id}`);
  return {valid: errors.length === 0, errors, performance_root: plan?.performance_root ?? null, curve_count: plan?.curves?.length ?? 0};
}
