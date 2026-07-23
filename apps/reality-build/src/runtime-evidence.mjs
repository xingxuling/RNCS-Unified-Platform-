import {UnifiedManufacturingSession} from '@taowind/reality-studio-native';
import {clone,seal} from './canonical.mjs';

export const RUNTIME_EVIDENCE_FORMAT='reality-build.runtime-evidence.v0.1';
export const RUNTIME_EVIDENCE_VERSION='0.1.0-alpha.1';

function normalizeTrace(trace){
  const frames=Array.isArray(trace)&&trace.length?trace:[{},{}];
  return frames.map(frame=>frame&&typeof frame==='object'&&!Array.isArray(frame)?clone(frame):{});
}

export function buildRuntimeEvidence({project,request,identity}={}){
  const trace=normalizeTrace(request?.runtime_trace);
  const session=new UnifiedManufacturingSession(project,{sessionId:`build-runtime:${identity.build_id}`});
  const initialCheckpoint=session.createRuntimeCheckpoint('build-initial').runtime_checkpoint;
  for(const input of trace)session.step(input);
  const artifacts=session.exportArtifacts();
  const evidence=seal({
    format:RUNTIME_EVIDENCE_FORMAT,
    version:RUNTIME_EVIDENCE_VERSION,
    build_id:identity.build_id,
    build_key:identity.build_key,
    project_root:project.project_root,
    program_root:artifacts.runtime_timeline.program_root,
    trace,
    initial_checkpoint_root:initialCheckpoint.checkpoint_root,
    timeline_root:artifacts.runtime_timeline.timeline_root,
    replay_root:artifacts.runtime_replay.replay_root,
    deterministic:artifacts.runtime_replay.deterministic,
    final_state_root:artifacts.runtime_replay.actual_state_root
  },'evidence_root');
  return{evidence,timeline:artifacts.runtime_timeline,replay:artifacts.runtime_replay,checkpoint:initialCheckpoint};
}

export function runtimeEvidenceSummary(runtimeEvidence){
  const e=runtimeEvidence?.evidence??runtimeEvidence;
  if(!e)return null;
  return{format:e.format,version:e.version,evidence_root:e.evidence_root,timeline_root:e.timeline_root,replay_root:e.replay_root,deterministic:e.deterministic,final_state_root:e.final_state_root};
}
